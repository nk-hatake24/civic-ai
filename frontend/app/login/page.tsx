'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      router.push('/chat')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await register(email, name, password, confirmPassword)
      router.push('/chat')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-semibold text-primary mb-2">CivicAI</h1>
          <p className="text-muted-foreground">AI-powered civic engagement platform</p>
        </div>

        {/* Form Container */}
        <div className="bg-card rounded-lg border border-border p-6">
          {/* Toggle Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border pb-4">
            <button
              onClick={() => {
                setIsLogin(true)
                setError('')
              }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                isLogin
                  ? 'text-primary border-b-2 border-primary -mb-4 pb-4'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setIsLogin(false)
                setError('')
              }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                !isLogin
                  ? 'text-primary border-b-2 border-primary -mb-4 pb-4'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded border border-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Log In'}
              </Button>

            
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded border border-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Register'}
              </Button>

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                <p className="font-medium mb-1">Password Requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>At least 8 characters</li>
                  <li>Must match confirmation</li>
                </ul>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
