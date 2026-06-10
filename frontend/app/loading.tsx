export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="space-y-6 text-center">
        <div className="inline-flex flex-col items-center gap-4">
          <h1 className="text-2xl font-display font-semibold text-primary">CivicAI</h1>

          {/* Animated loader */}
          <div className="flex gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>

        <p className="text-muted-foreground text-sm">Loading your civic engagement platform...</p>
      </div>
    </div>
  )
}
