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
        const { userRequest, action, customizationId, sessionId } = await req.json();

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

        // Handle different actions
        if (action === 'generate') {
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
            
            // Generate UI modification based on user request
            // Try GPT-5-mini first, fallback to GPT-4o-mini
            let openaiResponse;
            let modelUsed = 'gpt-5-mini-2025-08-07';
            
            const requestBody = {
                messages: [
                    {
                        role: 'system',
                        content: `You are a UI customization assistant for a CRM application. The CRM has these components:
- dashboard-metrics (main dashboard cards)
- metric-card (individual metric displays)
- task-overview-card (task summary card)
- recent-activities-card (activity timeline card)
- deal-pipeline (kanban board)
- deal-stage-column (stage columns in kanban)
- deal-card (individual deal cards)
- customer-card (customer list items)
- ticket-card (support ticket items)

When user requests UI changes, provide specific CSS/Tailwind modifications in JSON format with:
- component: component name (use data-component attribute names above)
- modifications: object with CSS properties or styling details
- description: what will change
- preview: text description of visual result

Available modifications:
- colors: { background, text, border }
- spacing: { padding, margin, gap }
- fontSize: size value
- borderRadius: radius value
- theme: "neon", "minimal", "colorful", "dark", "light"

Example response:
{
  "component": "deal-card",
  "modifications": {
    "colors": { "background": "#10b981", "text": "#ffffff" },
    "fontSize": "18px",
    "theme": "neon"
  },
  "description": "Changed deal cards to vibrant green with neon effect",
  "preview": "Deal cards now have bright green background with white text and glowing border"
}`
                    },
                    {
                        role: 'user',
                        content: `User wants to: "${userRequest}"\n\nProvide UI customization in JSON format.`
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
            
            // Parse customization
            let customization = {
                component: 'unknown',
                modifications: {},
                description: '',
                preview: ''
            };
            
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    customization = JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                customization = {
                    component: 'general',
                    modifications: { theme: 'custom' },
                    description: 'Custom styling applied',
                    preview: responseText
                };
            }

            // Save customization to database
            const saveResponse = await fetch(`${supabaseUrl}/rest/v1/ui_customizations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    user_id: userId,
                    customization_name: userRequest.substring(0, 100),
                    component_name: customization.component,
                    modifications: customization.modifications,
                    is_active: false // Not active until user applies
                })
            });

            const savedCustomizations = await saveResponse.json();
            const savedCustomization = savedCustomizations[0];

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

            // Save to chat history if sessionId provided
            if (sessionId) {
                // Save user message
                await fetch(`${supabaseUrl}/rest/v1/chat_messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        session_id: sessionId,
                        user_id: userId,
                        role: 'user',
                        content: userRequest
                    })
                });

                // Save assistant response
                await fetch(`${supabaseUrl}/rest/v1/chat_messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        session_id: sessionId,
                        user_id: userId,
                        role: 'assistant',
                        content: `I've created a customization for you!\n\n**Component:** ${customization.component}\n**Changes:** ${customization.description}\n\n**Preview:** ${customization.preview}`,
                        customization_data: {
                            ...customization,
                            id: savedCustomization.id
                        }
                    })
                });

                // Update session timestamp
                await fetch(`${supabaseUrl}/rest/v1/chat_sessions?id=eq.${sessionId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        updated_at: new Date().toISOString()
                    })
                });
            }

            return new Response(JSON.stringify({
                data: {
                    ...customization,
                    id: savedCustomization.id,
                    userRequest,
                    applied: false,
                    model: modelUsed
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (action === 'apply') {
            // Apply a customization
            if (!customizationId) {
                throw new Error('Customization ID is required');
            }

            // Update customization to active
            await fetch(`${supabaseUrl}/rest/v1/ui_customizations?id=eq.${customizationId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    is_active: true,
                    updated_at: new Date().toISOString()
                })
            });

            return new Response(JSON.stringify({
                data: { success: true, message: 'Customization applied' }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (action === 'rollback') {
            // Rollback a customization
            if (!customizationId) {
                throw new Error('Customization ID is required');
            }

            await fetch(`${supabaseUrl}/rest/v1/ui_customizations?id=eq.${customizationId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
            });

            return new Response(JSON.stringify({
                data: { success: true, message: 'Customization rolled back' }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (action === 'list') {
            // List all customizations
            const listResponse = await fetch(
                `${supabaseUrl}/rest/v1/ui_customizations?user_id=eq.${userId}&order=created_at.desc`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const customizations = await listResponse.json();

            return new Response(JSON.stringify({
                data: { customizations }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            throw new Error('Invalid action');
        }

    } catch (error) {
        console.error('UI wizard error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'UI_WIZARD_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
