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
    const { customerId } = await req.json()

    if (!customerId) {
      throw new Error('Missing customerId parameter')
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
      `${supabaseUrl}/rest/v1/user_settings?user_id=eq.${userId}&select=openai_api_key,ai_features_enabled`,
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

    // Fetch customer data
    const customerResponse = await fetch(
      `${supabaseUrl}/rest/v1/customers?id=eq.${customerId}&user_id=eq.${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    )

    if (!customerResponse.ok) {
      throw new Error('Failed to fetch customer data')
    }

    const customers = await customerResponse.json()
    if (!customers || customers.length === 0) {
      throw new Error('Customer not found')
    }

    const customer = customers[0]

    // Fetch related deals
    const dealsResponse = await fetch(
      `${supabaseUrl}/rest/v1/deals?customer_id=eq.${customerId}&user_id=eq.${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    )

    const deals = dealsResponse.ok ? await dealsResponse.json() : []

    // Fetch related activities
    const activitiesResponse = await fetch(
      `${supabaseUrl}/rest/v1/activities?related_id=eq.${customerId}&related_type=eq.customer&user_id=eq.${userId}`,
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
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        status: customer.status,
        tags: customer.tags,
        custom_fields: customer.custom_fields,
      },
      deals: deals.map((d: any) => ({
        title: d.title,
        value: d.value,
        stage: d.stage,
        probability: d.probability,
        status: d.status,
      })),
      activities: activities.map((a: any) => ({
        type: a.type,
        subject: a.subject,
        status: a.status,
        due_date: a.due_date,
      })),
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
            content: 'You are a CRM assistant that analyzes customer data and provides actionable insights. Focus on patterns, opportunities, risks, and recommendations.'
          },
          {
            role: 'user',
            content: `Analyze this customer data and provide insights:\n\n${JSON.stringify(context, null, 2)}\n\nProvide:\n1. Key patterns and trends\n2. Opportunities for upselling or engagement\n3. Potential risks or concerns\n4. Recommended next actions`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const openaiData = await openaiResponse.json()
    const insights = openaiData.choices[0].message.content

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

    // Store insights in database
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
          insight_type: 'customer_analysis',
          insight_data: {
            insights,
            summary: {
              totalDeals: deals.length,
              totalActivities: activities.length,
            },
          },
          confidence_score: 0.85,
        }),
      }
    )

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          insights,
          summary: {
            totalDeals: deals.length,
            totalActivities: activities.length,
          },
        }
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
          code: 'AI_INSIGHTS_ERROR',
          message: error.message || 'Failed to generate insights'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
