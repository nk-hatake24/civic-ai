'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div>
          <h1 className="text-4xl font-display font-semibold text-destructive mb-2">
            Oops!
          </h1>
          <p className="text-2xl font-semibold text-foreground">Something went wrong</p>
        </div>

        <p className="text-muted-foreground">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Button
            onClick={() => reset()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/chat'}>
            Go to Chat
          </Button>
        </div>
      </div>
    </div>
  )
}
