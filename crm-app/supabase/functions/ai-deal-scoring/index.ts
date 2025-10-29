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
        const { dealId } = await req.json();

        if (!dealId) {
            throw new Error('Deal ID is required');
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

        // Fetch deal data
        const dealResponse = await fetch(
            `${supabaseUrl}/rest/v1/deals?id=eq.${dealId}&user_id=eq.${userId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        const deals = await dealResponse.json();
        if (!deals || deals.length === 0) {
            throw new Error('Deal not found');
        }

        const deal = deals[0];

        // Fetch customer data if available
        let customerData = null;
        if (deal.customer_id) {
            const customerResponse = await fetch(
                `${supabaseUrl}/rest/v1/customers?id=eq.${deal.customer_id}&user_id=eq.${userId}&select=*`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            const customers = await customerResponse.json();
            customerData = customers[0] || null;
        }

        // Fetch related activities
        const activitiesResponse = await fetch(
            `${supabaseUrl}/rest/v1/activities?deal_id=eq.${dealId}&user_id=eq.${userId}&select=*&order=created_at.desc&limit=10`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        const activities = await activitiesResponse.json();

        // Prepare analysis data
        const analysisData = {
            deal: {
                title: deal.title,
                value: deal.value,
                stage: deal.stage,
                current_probability: deal.probability,
                expected_close_date: deal.expected_close_date,
                created_at: deal.created_at
            },
            customer: customerData ? {
                name: customerData.name,
                company: customerData.company,
                tags: customerData.tags
            } : null,
            activities: activities.map(a => ({
                type: a.type,
                subject: a.subject,
                completed: a.completed,
                created_at: a.created_at
            }))
        };

        // Try GPT-5-mini first, fallback to GPT-4o-mini
        let openaiResponse;
        let modelUsed = 'gpt-5-mini-2025-08-07';
        
        const requestBody = {
            messages: [
                {
                    role: 'system',
                    content: 'You are a sales analytics expert. Analyze deal data and provide probability scores with detailed explanations. Consider stage, activities, customer engagement, and timeline.'
                },
                {
                    role: 'user',
                    content: `Analyze this deal and provide a probability score (0-100) with explanation:\n\n${JSON.stringify(analysisData, null, 2)}\n\nProvide response in JSON format with: probability (number 0-100), confidence (high/medium/low), factors (array of positive/negative factors), and recommendation (string).`
                }
            ],
            temperature: 0.7,
            max_tokens: 500
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
        let scoring = { probability: 50, confidence: 'medium', factors: [], recommendation: '' };
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                scoring = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            scoring = {
                probability: deal.probability || 50,
                confidence: 'low',
                factors: ['Analysis completed with limited data'],
                recommendation: responseText
            };
        }

        // Store insights
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
                entity_type: 'deal',
                entity_id: dealId,
                insight_type: 'deal_scoring',
                insight_data: { ...scoring, model: modelUsed },
                confidence_score: scoring.probability / 100
            })
        });

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
                ...scoring,
                dealValue: deal.value,
                currentStage: deal.stage,
                model: modelUsed
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Deal scoring error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'DEAL_SCORING_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
