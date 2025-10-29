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
        const { scenario, customerId, context } = await req.json();

        if (!scenario) {
            throw new Error('Email scenario is required');
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

        // Fetch customer data if provided
        let customerData = null;
        if (customerId) {
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
            customerData = customers[0] || null;
        }

        // Build context for AI
        const emailContext = {
            scenario,
            customer: customerData ? {
                name: customerData.name,
                company: customerData.company
            } : null,
            additionalContext: context || ''
        };

        // Try GPT-5-mini first, fallback to GPT-4o-mini
        let openaiResponse;
        let modelUsed = 'gpt-5-mini-2025-08-07';
        
        const requestBody = {
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional business email writer. Create personalized, professional email templates based on the scenario and customer context. Include subject line and body.'
                },
                {
                    role: 'user',
                    content: `Create an email template for this scenario:\n\nScenario: ${scenario}\nCustomer: ${customerData ? customerData.name + ' at ' + (customerData.company || 'their company') : 'General template'}\nContext: ${context || 'None'}\n\nProvide the output in JSON format with "subject" and "body" fields.`
                }
            ],
            temperature: 0.8,
            max_tokens: 600
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
        let template = { subject: '', body: '' };
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                template = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            // Fallback: extract from text
            template = {
                subject: 'Follow-up',
                body: responseText
            };
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
                template,
                scenario,
                personalized: !!customerId,
                model: modelUsed
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Email template generation error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'TEMPLATE_GENERATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
