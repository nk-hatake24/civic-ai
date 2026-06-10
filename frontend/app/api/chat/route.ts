import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversation_id, language } = body

    if (!message || !conversation_id) {
      return NextResponse.json(
        { error: 'invalid_request' },
        { status: 400 }
      )
    }

    // Get environment variables (server-only)
    const backendUrl = process.env.MCP_BACKEND_URL
    const apiKey = process.env.MCP_API_KEY

    if (!backendUrl || !apiKey) {
      console.error('[v0] Missing environment variables: MCP_BACKEND_URL or MCP_API_KEY')
      return NextResponse.json(
        { error: 'config' },
        { status: 500 }
      )
    }

    // Forward request to MCP backend
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        message,
        conversation_id,
        language: language || 'en',
      }),
    })

    // Handle upstream errors
    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'auth' },
          { status: 401 }
        )
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'rate_limit' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: 'upstream' },
        { status: response.status }
      )
    }

    const chatResponse = await response.json()

    return NextResponse.json(chatResponse)
  } catch (error) {
    console.error('[v0] Chat API error:', error)
    return NextResponse.json(
      { error: 'network' },
      { status: 500 }
    )
  }
}
