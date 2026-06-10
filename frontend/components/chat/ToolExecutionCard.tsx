// components/chat/ToolExecutionCard.tsx
'use client'

import { ToolCall } from '@/lib/types'
import { formatDuration, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CheckCircle2, XCircle, Loader2, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface ToolExecutionCardProps {
  toolCall: ToolCall
}

export function ToolExecutionCard({ toolCall }: ToolExecutionCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  const borderColor = {
    calling: 'border-accent',
    success: 'border-success',
    error: 'border-destructive',
  }[toolCall.status]

  const Icon = {
    calling: Loader2,
    success: CheckCircle2,
    error: XCircle,
  }[toolCall.status]

  const duration = toolCall.endTime ? toolCall.endTime - toolCall.startTime : 0

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn('border-l-4 bg-muted/50 rounded-lg p-3 mb-4', borderColor)}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-left">
              <Icon className={cn('w-4 h-4', toolCall.status === 'calling' && 'animate-spin')} />
              <code className="font-mono text-xs font-semibold">{toolCall.name}</code>
              {duration > 0 && <Badge variant="secondary" className="text-xs">{formatDuration(duration)}</Badge>}
            </div>
            <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 pt-3 border-t border-border">
          {toolCall.input ? (
            <div className="mb-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Input</p>
              <ScrollArea className="bg-card border border-border rounded p-2">
                <pre className="font-mono text-xs text-foreground whitespace-pre-wrap break-words">
                  {String(JSON.stringify(toolCall.input, null, 2))}
                </pre>
              </ScrollArea>
            </div>
          ) : null}

          {toolCall.result ? (
            <div className="mb-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Result</p>
              <ScrollArea className="bg-card border border-border rounded p-2">
                <pre className="font-mono text-xs text-foreground whitespace-pre-wrap break-words">
                  {String(JSON.stringify(toolCall.result, null, 2))}
                </pre>
              </ScrollArea>
            </div>
          ) : null}

          {toolCall.error ? (
            <div className="mb-3">
              <p className="text-xs font-semibold text-destructive mb-2">Error</p>
              <div className="bg-destructive/10 border border-destructive rounded p-2 text-xs text-destructive">
                {toolCall.error}
              </div>
            </div>
          ) : null}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
