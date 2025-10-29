Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { entityType, entityId } = await req.json();

        if (!entityType || !entityId) {
            throw new Error('Entity type and ID are required');
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

        // Fetch entity data based on type
        let contextData = {};
        
        if (entityType === 'customer') {
            const response = await fetch(
                `${supabaseUrl}/rest/v1/customers?id=eq.${entityId}&user_id=eq.${userId}&select=*`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            const data = await response.json();
            contextData = data[0] || {};
        } else if (entityType === 'deal') {
            const response = await fetch(
                `${supabaseUrl}/rest/v1/deals?id=eq.${entityId}&user_id=eq.${userId}&select=*`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            const data = await response.json();
            contextData = data[0] || {};
        } else if (entityType === 'ticket') {
            const response = await fetch(
                `${supabaseUrl}/rest/v1/tickets?id=eq.${entityId}&user_id=eq.${userId}&select=*`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            const data = await response.json();
            contextData = data[0] || {};
        }

        // Fetch recent activities for context
        const activitiesResponse = await fetch(
            `${supabaseUrl}/rest/v1/activities?${entityType}_id=eq.${entityId}&user_id=eq.${userId}&select=*&order=created_at.desc&limit=5`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        const recentActivities = await activitiesResponse.json();

        // Try GPT-5-mini first, fallback to GPT-4o-mini
        let openaiResponse;
        let modelUsed = 'gpt-5-mini-2025-08-07';
        
        const requestBody = {
            messages: [
                {
                    role: 'system',
                    content: 'You are a CRM productivity assistant. Suggest relevant activities and next steps based on context. Be specific and actionable.'
                },
                {
                    role: 'user',
                    content: `Based on this ${entityType} data and recent activities, suggest 3-5 specific next actions:\n\nContext: ${JSON.stringify(contextData, null, 2)}\n\nRecent Activities: ${JSON.stringify(recentActivities, null, 2)}\n\nProvide suggestions in JSON format as an array of objects with: type (call/email/task/meeting), subject, and reason.`
                }
            ],
            temperature: 0.7,
            max_tokens: 400
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
        const suggestionsText = openaiData.choices[0].message.content;
        
        // Try to parse JSON from response
        let suggestions = [];
        try {
            const jsonMatch = suggestionsText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                suggestions = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            // Fallback: create structured suggestions from text
            suggestions = [{
                type: 'task',
                subject: 'Follow up based on AI recommendations',
                reason: suggestionsText
            }];
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
                suggestions,
                context: {
                    entityType,
                    recentActivityCount: recentActivities.length,
                    model: modelUsed
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Activity suggestions error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'SUGGESTIONS_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
