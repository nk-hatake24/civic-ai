// app/chat/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { ContextPanel } from '@/components/layout/ContextPanel'

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login')
    }
  }, [isHydrated, isAuthenticated, router])

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-semibold text-primary">CivicAI</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar Bureau */}
      <div className="hidden md:flex h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Contenu Principal */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header Mobile */}
        <div className="md:hidden flex-shrink-0">
          <MobileHeader />
        </div>

        {/* Zone centrale : Chat + Context Panel */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Wrapper du ChatPanel */}
          <div className="flex-1 flex flex-col h-full min-h-0 relative bg-background">
            {children}
          </div>

          {/* Context Panel */}
          <div className="hidden lg:flex h-full flex-shrink-0">
            <ContextPanel />
          </div>
        </div>
      </div>
    </div>
  )
}