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
        const { customerId } = await req.json();

        if (!customerId) {
            throw new Error('Customer ID is required');
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
            `${supabaseUrl}/rest/v1/user_settings?user_id=eq.${userId}&select=openai_api_key,ai_features_enabled`,
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

        // Fetch customer data
        const customerResponse = await fetch(
            `${supabaseUrl}/rest/v1/customers?id=eq.${customerId}&user_id=eq.${userId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        const customers = await customerResponse.json();
        if (!customers || customers.length === 0) {
            throw new Error('Customer not found');
        }

        const customer = customers[0];

        // Fetch related deals
        const dealsResponse = await fetch(
            `${supabaseUrl}/rest/v1/deals?customer_id=eq.${customerId}&user_id=eq.${userId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        const deals = await dealsResponse.json();

        // Fetch related activities
        const activitiesResponse = await fetch(
            `${supabaseUrl}/rest/v1/activities?customer_id=eq.${customerId}&user_id=eq.${userId}&select=*&order=created_at.desc&limit=10`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        const activities = await activitiesResponse.json();

        // Fetch related tickets
        const ticketsResponse = await fetch(
            `${supabaseUrl}/rest/v1/tickets?customer_id=eq.${customerId}&user_id=eq.${userId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        const tickets = await ticketsResponse.json();

        // Prepare data for AI analysis
        const analysisData = {
            customer: {
                name: customer.name,
                company: customer.company,
                tags: customer.tags || [],
                created_at: customer.created_at
            },
            deals: deals.map(d => ({
                title: d.title,
                value: d.value,
                stage: d.stage,
                probability: d.probability
            })),
            activities: activities.map(a => ({
                type: a.type,
                subject: a.subject,
                completed: a.completed,
                created_at: a.created_at
            })),
            tickets: tickets.map(t => ({
                title: t.title,
                status: t.status,
                priority: t.priority
            }))
        };

        // Try GPT-5-mini first, fallback to GPT-4o-mini
        let openaiResponse;
        let modelUsed = 'gpt-5-mini-2025-08-07';
        
        try {
            openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-5-mini-2025-08-07',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a CRM analytics assistant. Analyze customer data and provide actionable insights, patterns, and recommendations. Be concise and specific.'
                        },
                        {
                            role: 'user',
                            content: `Analyze this customer data and provide insights:\n${JSON.stringify(analysisData, null, 2)}\n\nProvide:\n1. Key patterns in their behavior\n2. Engagement level assessment\n3. Recommended next actions\n4. Risk or opportunity indicators`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
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
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a CRM analytics assistant. Analyze customer data and provide actionable insights, patterns, and recommendations. Be concise and specific.'
                        },
                        {
                            role: 'user',
                            content: `Analyze this customer data and provide insights:\n${JSON.stringify(analysisData, null, 2)}\n\nProvide:\n1. Key patterns in their behavior\n2. Engagement level assessment\n3. Recommended next actions\n4. Risk or opportunity indicators`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!openaiResponse.ok) {
                throw new Error('OpenAI API call failed');
            }
        }

        const openaiData = await openaiResponse.json();
        const insights = openaiData.choices[0].message.content;

        // Store insights in database
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
                entity_type: 'customer',
                entity_id: customerId,
                insight_type: 'customer_analysis',
                insight_data: { insights, timestamp: new Date().toISOString(), model: modelUsed },
                confidence_score: 0.85
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
                insights,
                summary: {
                    totalDeals: deals.length,
                    totalActivities: activities.length,
                    totalTickets: tickets.length,
                    recentEngagement: activities.length > 0
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Customer insights error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'INSIGHTS_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
