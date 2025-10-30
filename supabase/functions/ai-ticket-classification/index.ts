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
    const { ticketId, title, description } = await req.json()

    if (!ticketId && (!title || !description)) {
      throw new Error('Missing required parameters. Provide either ticketId or both title and description.')
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

    // Get ticket data
    let ticketTitle = title
    let ticketDescription = description
    let ticket = null

    if (ticketId) {
      const ticketResponse = await fetch(
        `${supabaseUrl}/rest/v1/tickets?id=eq.${ticketId}&user_id=eq.${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      )

      if (!ticketResponse.ok) {
        throw new Error('Failed to fetch ticket data')
      }

      const tickets = await ticketResponse.json()
      if (!tickets || tickets.length === 0) {
        throw new Error('Ticket not found')
      }

      ticket = tickets[0]
      ticketTitle = ticket.title
      ticketDescription = ticket.description
    }

    // Prepare context for OpenAI
    const context = {
      title: ticketTitle,
      description: ticketDescription,
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
            content: 'You are a support ticket classification AI. Analyze the ticket and return JSON with: priority (low|medium|high|urgent), suggestedStatus (new|in_progress|pending|resolved|closed), reasoning (string explaining the classification), and category (string like "technical", "billing", "feature_request", etc.).'
          },
          {
            role: 'user',
            content: `Classify this support ticket:\n\n${JSON.stringify(context, null, 2)}\n\nDetermine the priority level, suggested status, category, and explain your reasoning.`
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const openaiData = await openaiResponse.json()
    const classification = JSON.parse(openaiData.choices[0].message.content)

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

    // Store insights if ticket exists
    if (ticketId) {
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
            entity_type: 'ticket',
            entity_id: ticketId,
            insight_type: 'ticket_classification',
            insight_data: classification,
            confidence_score: 0.85,
          }),
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: classification
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
          code: 'TICKET_CLASSIFICATION_ERROR',
          message: error.message || 'Failed to classify ticket'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
