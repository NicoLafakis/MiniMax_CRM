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
    const { fileData, fileName, relatedType, relatedId } = await req.json()

    if (!fileData || !fileName || !relatedType || !relatedId) {
      throw new Error('Missing required parameters')
    }

    // Get service role key for storage operations
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

    // Verify user
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

    // Convert base64 to binary
    const base64Data = fileData.split(',')[1] || fileData
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

    // Generate unique file path
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${relatedType}/${relatedId}/${timestamp}-${sanitizedFileName}`

    // Upload to storage using service role
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/crm-attachments/${filePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/octet-stream',
        },
        body: binaryData,
      }
    )

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      throw new Error(`Upload failed: ${error}`)
    }

    // Get public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/crm-attachments/${filePath}`

    // Save attachment metadata to database
    const attachmentData = {
      user_id: userId,
      related_type: relatedType,
      related_id: relatedId,
      file_name: fileName,
      file_path: filePath,
      file_size: binaryData.length,
      mime_type: fileData.match(/data:([^;]+);/)?.[1] || 'application/octet-stream',
    }

    const dbResponse = await fetch(
      `${supabaseUrl}/rest/v1/attachments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(attachmentData),
      }
    )

    if (!dbResponse.ok) {
      const error = await dbResponse.text()
      throw new Error(`Database insert failed: ${error}`)
    }

    const attachment = await dbResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        publicUrl,
        attachment: attachment[0]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: {
          code: 'UPLOAD_ERROR',
          message: error.message
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
