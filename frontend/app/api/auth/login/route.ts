import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL 
    
    // 1. Call Backend
    const response = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.detail || 'Login failed' }, { status: response.status })
    }

    // 2. GENERATE NAME FROM EMAIL (The Quick Fix)
    // Example: "michel.nkenla@gmail.com" -> "michel.nkenla"
    const generatedName = email.split('@')[0];

    // 3. Set Cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    // 4. Return to Frontend
    return NextResponse.json({
      success: true,
      user: {
        id: data.user_id, // Using user_id from your specific API response
        email: email,
        name: generatedName // Now it's the part before @ instead of 'Admin'
      }
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}