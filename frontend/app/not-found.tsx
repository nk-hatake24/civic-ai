import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div>
          <h1 className="text-6xl font-display font-semibold text-primary mb-2">404</h1>
          <p className="text-2xl font-semibold text-foreground">Page not found</p>
        </div>

        <p className="text-muted-foreground">
          The page you are looking for does not exist or may have been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <Link href="/chat">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Go to Chat
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
