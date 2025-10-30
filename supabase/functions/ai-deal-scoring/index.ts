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
    const { dealId } = await req.json()

    if (!dealId) {
      throw new Error('Missing dealId parameter')
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

    // Fetch deal data
    const dealResponse = await fetch(
      `${supabaseUrl}/rest/v1/deals?id=eq.${dealId}&user_id=eq.${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    )

    if (!dealResponse.ok) {
      throw new Error('Failed to fetch deal data')
    }

    const deals = await dealResponse.json()
    if (!deals || deals.length === 0) {
      throw new Error('Deal not found')
    }

    const deal = deals[0]

    // Fetch customer data
    let customer = null
    if (deal.customer_id) {
      const customerResponse = await fetch(
        `${supabaseUrl}/rest/v1/customers?id=eq.${deal.customer_id}&user_id=eq.${userId}`,
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
          customer = customers[0]
        }
      }
    }

    // Fetch related activities
    const activitiesResponse = await fetch(
      `${supabaseUrl}/rest/v1/activities?related_id=eq.${dealId}&related_type=eq.deal&user_id=eq.${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    )

    const activities = activitiesResponse.ok ? await activitiesResponse.json() : []

    // Prepare context for OpenAI
    const context = {
      deal: {
        title: deal.title,
        value: deal.value,
        stage: deal.stage,
        status: deal.status,
        probability: deal.probability,
        expected_close_date: deal.expected_close_date,
        created_at: deal.created_at,
      },
      customer: customer ? {
        name: customer.name,
        company: customer.company,
        status: customer.status,
      } : null,
      activities: activities.map((a: any) => ({
        type: a.type,
        status: a.status,
        created_at: a.created_at,
      })),
      metrics: {
        daysOpen: Math.floor((Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        activityCount: activities.length,
        recentActivityCount: activities.filter((a: any) => {
          const daysSince = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24)
          return daysSince <= 7
        }).length,
      }
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
            content: 'You are a sales analytics AI that scores deal probability. Analyze the deal data and return JSON with: probability (0-100), confidence (low|medium|high), factors (array of strings explaining key factors), and recommendation (string with actionable advice).'
          },
          {
            role: 'user',
            content: `Score this deal's probability of closing:\n\n${JSON.stringify(context, null, 2)}\n\nConsider: deal stage, value, time open, activity frequency, customer status, and expected close date.`
          }
        ],
        temperature: 0.5,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const openaiData = await openaiResponse.json()
    const scoring = JSON.parse(openaiData.choices[0].message.content)

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

    // Store insights
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
          entity_type: 'deal',
          entity_id: dealId,
          insight_type: 'deal_scoring',
          insight_data: scoring,
          confidence_score: scoring.confidence === 'high' ? 0.90 : scoring.confidence === 'medium' ? 0.75 : 0.60,
        }),
      }
    )

    return new Response(
      JSON.stringify({
        success: true,
        data: scoring
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
          code: 'DEAL_SCORING_ERROR',
          message: error.message || 'Failed to score deal'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
