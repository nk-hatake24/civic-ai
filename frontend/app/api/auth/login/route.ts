import { promises as fs } from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

interface User {
  id: string
  email: string
  name: string
  password: string
}

interface UsersData {
  users: User[]
}

async function readUsers(): Promise<UsersData> {
  const filePath = path.join(process.cwd(), 'lib', 'users.json')
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist, return default users
    return {
      users: [
        {
          id: '1',
          email: 'admin@gmail.com',
          name: 'Admin User',
          password: 'admin',
        },
      ],
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Read users from file
    const usersData = await readUsers()

    // Find user by email
    const user = usersData.users.find(
      (u: User) => u.email.toLowerCase() === email.toLowerCase()
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check password (in production, this should compare hashed passwords)
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Return user data (without password)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
