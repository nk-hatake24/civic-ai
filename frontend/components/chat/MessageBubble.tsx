// components/chat/MessageBubble.tsx
'use client'

import { Message } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import ReactMarkdown from 'react-markdown'
import RemarkGfm from 'remark-gfm'
import { Bot, User } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn('flex gap-3 mb-4 animate-message-enter', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <Avatar className="flex-shrink-0 h-8 w-8 mt-1">
        <AvatarFallback className={cn(isUser ? 'bg-accent' : 'bg-primary')}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Bubble */}
      <div
        className={cn(
          'max-w-md lg:max-w-lg rounded-xl px-4 py-3 shadow-sm',
          isUser
            ? 'bg-accent text-accent-foreground rounded-tr-none'
            : 'bg-card border border-border text-foreground rounded-tl-none'
        )}
      >
        {message.isStreaming ? (
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-current animate-dot-pulse" />
            <div className="w-2 h-2 rounded-full bg-current animate-dot-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full bg-current animate-dot-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        ) : (
          <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[RemarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
        {(() => {
          const date = new Date(message.timestamp)
          const hours = date.getHours().toString().padStart(2, '0')
          const minutes = date.getMinutes().toString().padStart(2, '0')
          return `${hours}:${minutes}`
        })()}
      </div>
    </div>
  )
}
