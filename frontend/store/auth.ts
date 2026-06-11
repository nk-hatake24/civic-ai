// store/auth.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  name: string
}

interface AuthStore {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string, confirmPassword: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Login failed')

        set({ user: data.user, isAuthenticated: true })
      },
      register: async (email, name, password, confirmPassword) => {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, password, confirmPassword }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Registration failed')

        set({ user: data.user, isAuthenticated: true })
      },
      logout: async () => {
        // Clear server-side cookie
        await fetch('/api/auth/logout', { method: 'POST' })
        // Clear local state
        set({ user: null, isAuthenticated: false })
        localStorage.removeItem('auth-store')
      },
    }),
    { name: 'auth-store' }
  )
)