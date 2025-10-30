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
    const { entityType, entityId } = await req.json()

    if (!entityType || !entityId) {
      throw new Error('Missing entityType or entityId parameter')
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

    // Fetch entity data
    const entityResponse = await fetch(
      `${supabaseUrl}/rest/v1/${entityType}s?id=eq.${entityId}&user_id=eq.${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    )

    if (!entityResponse.ok) {
      throw new Error(`Failed to fetch ${entityType} data`)
    }

    const entities = await entityResponse.json()
    if (!entities || entities.length === 0) {
      throw new Error(`${entityType} not found`)
    }

    const entity = entities[0]

    // Fetch existing activities
    const activitiesResponse = await fetch(
      `${supabaseUrl}/rest/v1/activities?related_id=eq.${entityId}&related_type=eq.${entityType}&user_id=eq.${userId}`,
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
      entityType,
      entity,
      recentActivities: activities.slice(0, 10).map((a: any) => ({
        type: a.type,
        subject: a.subject,
        status: a.status,
        due_date: a.due_date,
        completed_at: a.completed_at,
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
            content: 'You are a CRM assistant that suggests next best actions. Provide 3-5 specific, actionable suggestions based on the context. Return the response as a JSON array with objects containing: type (call|email|task|meeting), subject (string), and reason (string).'
          },
          {
            role: 'user',
            content: `Based on this ${entityType} data and recent activities, suggest next best actions:\n\n${JSON.stringify(context, null, 2)}`
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
    const responseContent = openaiData.choices[0].message.content
    const parsedResponse = JSON.parse(responseContent)
    const suggestions = parsedResponse.suggestions || []

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
          entity_type: entityType,
          entity_id: entityId,
          insight_type: 'activity_suggestions',
          insight_data: { suggestions },
          confidence_score: 0.80,
        }),
      }
    )

    return new Response(
      JSON.stringify({
        success: true,
        data: { suggestions }
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
          code: 'AI_SUGGESTIONS_ERROR',
          message: error.message || 'Failed to generate suggestions'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
