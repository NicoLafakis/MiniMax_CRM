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
    const { scenario, customerId, context: additionalContext } = await req.json()

    if (!scenario) {
      throw new Error('Missing scenario parameter')
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

    // Fetch customer data if provided
    let customerData = null
    if (customerId) {
      const customerResponse = await fetch(
        `${supabaseUrl}/rest/v1/customers?id=eq.${customerId}&user_id=eq.${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      )

      if (customerResponse.ok) {
        const customers = await customerResponse.json()
        if (customers && customers.length > 0) {
          customerData = customers[0]
        }
      }
    }

    // Prepare context for OpenAI
    const contextInfo = {
      scenario,
      customer: customerData ? {
        name: customerData.name,
        company: customerData.company,
        email: customerData.email,
      } : null,
      additionalContext,
    }

    // Call OpenAI API
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
            content: 'You are a professional email template generator for CRM. Create personalized, professional emails based on the scenario. Return JSON with "subject" and "body" fields. Keep emails concise and actionable.'
          },
          {
            role: 'user',
            content: `Generate an email template for this scenario:\n\n${JSON.stringify(contextInfo, null, 2)}\n\nMake it professional, personalized, and include placeholders like [CUSTOMER_NAME] if customer data is not provided.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const openaiData = await openaiResponse.json()
    const template = JSON.parse(openaiData.choices[0].message.content)

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

    // Store template if customer is provided
    if (customerId) {
      await fetch(
        `${supabaseUrl}/rest/v1/ai_insights`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            entity_type: 'customer',
            entity_id: customerId,
            insight_type: 'email_template',
            insight_data: { scenario, template },
            confidence_score: 0.90,
          }),
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { template }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: {
          code: 'EMAIL_TEMPLATE_ERROR',
          message: error.message || 'Failed to generate email template'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
