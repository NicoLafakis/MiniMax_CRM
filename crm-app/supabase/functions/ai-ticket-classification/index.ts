Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { ticketId, title, description } = await req.json();

        if (!title && !ticketId) {
            throw new Error('Ticket ID or title is required');
        }

        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        // Get user from token
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Get user's OpenAI API key from user_settings
        const settingsResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_settings?user_id=eq.${userId}&select=openai_api_key,ai_features_enabled,usage_count`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        const settings = await settingsResponse.json();
        if (!settings || settings.length === 0 || !settings[0].openai_api_key) {
            throw new Error('OpenAI API key not configured. Please add your API key in Settings.');
        }

        if (!settings[0].ai_features_enabled) {
            throw new Error('AI features are disabled. Please enable them in Settings.');
        }

        const openaiApiKey = settings[0].openai_api_key;

        // Get ticket data
        let ticketData = { title, description };
        
        if (ticketId) {
            const ticketResponse = await fetch(
                `${supabaseUrl}/rest/v1/tickets?id=eq.${ticketId}&user_id=eq.${userId}&select=*`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            const tickets = await ticketResponse.json();
            if (tickets && tickets.length > 0) {
                ticketData = tickets[0];
            }
        }

        // Try GPT-5-mini first, fallback to GPT-4o-mini
        let openaiResponse;
        let modelUsed = 'gpt-5-mini-2025-08-07';
        
        const requestBody = {
            messages: [
                {
                    role: 'system',
                    content: 'You are a customer service ticket classifier. Analyze ticket content and classify priority level based on urgency, impact, and keywords. Priority levels: urgent, high, medium, low.'
                },
                {
                    role: 'user',
                    content: `Classify this ticket's priority:\n\nTitle: ${ticketData.title}\nDescription: ${ticketData.description || 'Not provided'}\n\nProvide response in JSON format with: priority (urgent/high/medium/low), confidence (0-1), reasoning (string), and suggestedStatus (new/in_progress/pending/resolved).`
                }
            ],
            temperature: 0.5,
            max_tokens: 300
        };

        try {
            openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`
                },
                body: JSON.stringify({ ...requestBody, model: 'gpt-5-mini-2025-08-07' })
            });

            if (!openaiResponse.ok) {
                throw new Error('GPT-5 not available');
            }
        } catch (error) {
            // Fallback to GPT-4o-mini
            modelUsed = 'gpt-4o-mini';
            openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`
                },
                body: JSON.stringify({ ...requestBody, model: 'gpt-4o-mini' })
            });

            if (!openaiResponse.ok) {
                throw new Error('OpenAI API call failed');
            }
        }

        const openaiData = await openaiResponse.json();
        const responseText = openaiData.choices[0].message.content;
        
        // Parse JSON response
        let classification = { priority: 'medium', confidence: 0.7, reasoning: '', suggestedStatus: 'new' };
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                classification = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            classification = {
                priority: 'medium',
                confidence: 0.5,
                reasoning: responseText,
                suggestedStatus: 'new'
            };
        }

        // Store insights if ticketId provided
        if (ticketId) {
            await fetch(`${supabaseUrl}/rest/v1/ai_insights`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    user_id: userId,
                    entity_type: 'ticket',
                    entity_id: ticketId,
                    insight_type: 'priority_classification',
                    insight_data: { ...classification, model: modelUsed },
                    confidence_score: classification.confidence
                })
            });
        }

        // Increment usage count
        await fetch(`${supabaseUrl}/rest/v1/user_settings?user_id=eq.${userId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usage_count: (settings[0].usage_count || 0) + 1,
                last_used_at: new Date().toISOString()
            })
        });

        return new Response(JSON.stringify({
            data: {
                ...classification,
                model: modelUsed
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Ticket classification error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'CLASSIFICATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
