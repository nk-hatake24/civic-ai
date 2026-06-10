'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

export default function Page() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      if (isAuthenticated) {
        router.push('/chat')
      } else {
        router.push('/login')
      }
    }
  }, [isHydrated, isAuthenticated, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-display font-semibold text-primary">CivicAI</h1>
        <p className="text-muted-foreground mt-2">Redirecting...</p>
      </div>
    </div>
  )
}
