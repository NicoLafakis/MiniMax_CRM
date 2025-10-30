Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { action, userRequest, sessionId, customizationId } = await req.json()

    if (!action) {
      throw new Error('Missing action parameter')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration')
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey,
      },
    })

    if (!userResponse.ok) {
      throw new Error('Invalid user token')
    }

    const { id: userId } = await userResponse.json()

    // Get user's OpenAI API key
    const settingsResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_settings?user_id=eq.${userId}&select=openai_api_key,ai_features_enabled,usage_count`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    )

    if (!settingsResponse.ok) {
      throw new Error('Failed to fetch user settings')
    }

    const settings = await settingsResponse.json()

    if (!settings || settings.length === 0 || !settings[0].ai_features_enabled) {
      throw new Error('AI features are not enabled. Please enable them in Settings.')
    }

    const openaiApiKey = settings[0].openai_api_key
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please add it in Settings.')
    }

    // Handle different actions
    if (action === 'generate') {
      if (!userRequest) {
        throw new Error('Missing userRequest parameter')
      }

      // Save user message to chat history
      if (sessionId) {
        await fetch(
          `${supabaseUrl}/rest/v1/chat_messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: sessionId,
              role: 'user',
              content: userRequest,
            }),
          }
        )
      }

      // Call OpenAI API to generate customization
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a UI customization AI. Convert natural language requests into CSS/design modifications. Return JSON with: component (string like "deal-card", "customer-card", "sidebar"), description (string), preview (string describing what will change), and modifications (object with colors, spacing, fontSize, borderRadius, theme). Available components: deal-card, customer-card, ticket-card, activity-card, sidebar, dashboard, form-input.'
            },
            {
              role: 'user',
              content: `Create a UI customization for: "${userRequest}"\n\nReturn a JSON object with the customization details.`
            }
          ],
          temperature: 0.8,
          max_tokens: 400,
          response_format: { type: 'json_object' }
        }),
      })

      if (!openaiResponse.ok) {
        const error = await openaiResponse.text()
        throw new Error(`OpenAI API error: ${error}`)
      }

      const openaiData = await openaiResponse.json()
      const customization = JSON.parse(openaiData.choices[0].message.content)

      // Create customization in database
      const customizationResponse = await fetch(
        `${supabaseUrl}/rest/v1/ui_customizations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            user_id: userId,
            customization_name: userRequest.substring(0, 100),
            component_name: customization.component,
            modifications: customization.modifications,
            is_active: false, // Not active until user applies it
          }),
        }
      )

      if (!customizationResponse.ok) {
        const error = await customizationResponse.text()
        throw new Error(`Failed to save customization: ${error}`)
      }

      const savedCustomization = await customizationResponse.json()
      customization.id = savedCustomization[0].id

      // Save assistant message to chat history
      if (sessionId) {
        await fetch(
          `${supabaseUrl}/rest/v1/chat_messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: sessionId,
              role: 'assistant',
              content: `Customization created for ${customization.component}`,
              customization_data: customization,
            }),
          }
        )

        // Update session timestamp
        await fetch(
          `${supabaseUrl}/rest/v1/chat_sessions?id=eq.${sessionId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              updated_at: new Date().toISOString(),
            }),
          }
        )
      }

      // Update usage count
      await fetch(
        `${supabaseUrl}/rest/v1/user_settings?user_id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usage_count: (settings[0].usage_count || 0) + 1,
            last_used_at: new Date().toISOString(),
          }),
        }
      )

      return new Response(
        JSON.stringify({
          success: true,
          data: customization
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else if (action === 'apply') {
      if (!customizationId) {
        throw new Error('Missing customizationId parameter')
      }

      // Activate the customization
      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/ui_customizations?id=eq.${customizationId}&user_id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_active: true,
            updated_at: new Date().toISOString(),
          }),
        }
      )

      if (!updateResponse.ok) {
        throw new Error('Failed to apply customization')
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Customization applied successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else if (action === 'rollback') {
      if (!customizationId) {
        throw new Error('Missing customizationId parameter')
      }

      // Deactivate the customization
      const deleteResponse = await fetch(
        `${supabaseUrl}/rest/v1/ui_customizations?id=eq.${customizationId}&user_id=eq.${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      )

      if (!deleteResponse.ok) {
        throw new Error('Failed to rollback customization')
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Customization rolled back successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else {
      throw new Error(`Invalid action: ${action}`)
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: {
          code: 'UI_WIZARD_ERROR',
          message: error.message || 'Failed to process UI wizard request'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
