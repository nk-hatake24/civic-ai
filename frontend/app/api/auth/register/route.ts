import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s for registration

  try {
    const body = await request.json()
    const { email, name, password, confirmPassword } = body

    // 1. Server-side validation (Safety Net)
    if (!email || !name || !password || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL 
    // 2. Call FastAPI Backend
    const response = await fetch(`${backendUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        full_name: name, // FastAPI expects 'full_name'
        password: password
      }),
      signal: controller.signal,
    }).catch((err) => {
      if (err.name === 'AbortError') return 'TIMEOUT';
      return null;
    });

    // 3. Network/Timeout Checks
    if (response === 'TIMEOUT') return NextResponse.json({ error: 'Registration timed out' }, { status: 504 });
    if (!response || !(response instanceof Response)) return NextResponse.json({ error: 'Backend unreachable' }, { status: 503 });

    // 4. Content-Type Guard
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid backend response' }, { status: 502 });
    }

    const data = await response.json()
    const generatedName = email.split('@')[0];
    // 5. Handle Logic Errors (e.g., 400 User Already Exists)
    if (!response.ok) {
      const msg = data.detail || 'Registration failed';
      return NextResponse.json({ error: msg }, { status: response.status })
    }

    // 6. Success
    return NextResponse.json({
      success: true,
      user: {
        id: data.user_id,
        name: generatedName
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration Route Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    clearTimeout(timeoutId);
  }
}