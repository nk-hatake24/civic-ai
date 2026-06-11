// app/api/chat/stream/[jobId]/route.ts
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  // 1. Call Python's streaming endpoint
  const response = await fetch(`${backendUrl}/api/chat/stream/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'text/event-stream',
    },
  })
 
  console.log(response.body)
  // 2. PIPE the response body directly back to the browser
  // This is the fastest way to handle streaming in Next.js
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}