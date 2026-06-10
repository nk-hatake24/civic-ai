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

async function writeUsers(data: UsersData): Promise<void> {
  const filePath = path.join(process.cwd(), 'lib', 'users.json')
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, password, confirmPassword } = body

    // Validation
    if (!email || !name || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Read existing users
    const usersData = await readUsers()

    // Check if email already exists
    const existingUser = usersData.users.find(
      (u: User) => u.email.toLowerCase() === email.toLowerCase()
    )
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Create new user
    const newUser: User = {
      id: (Math.max(...usersData.users.map((u: User) => parseInt(u.id))) + 1).toString(),
      email,
      name,
      password, // In production, this should be hashed
    }

    // Add user to users data
    usersData.users.push(newUser)

    // Write updated users to file
    await writeUsers(usersData)

    // Return success with user data (without password)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
