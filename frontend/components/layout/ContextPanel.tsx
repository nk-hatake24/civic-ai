'use client'

import { useChatStore } from '@/store'
import { formatDuration } from '@/lib/utils'
import { t } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CheckCircle2, Clock, Database, Zap, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'

export function ContextPanel() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const activeConversation = useChatStore((state) => state.getActiveConversation())
  const language = useChatStore((state) => state.language)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    return (
      <div className="w-[300px] border-l border-border bg-card p-4 hidden lg:flex flex-col items-center justify-center text-muted-foreground text-sm">
        <div className="h-10 bg-muted/50 rounded w-32" />
      </div>
    )
  }

  if (!activeConversation) {
    return (
      <div className="w-[300px] border-l border-border bg-card p-4 hidden lg:flex flex-col items-center justify-center text-muted-foreground text-sm">
        {language === 'en' ? 'Select a conversation' : 'Sélectionnez une conversation'}
      </div>
    )
  }

  // Get last successful tool call
  const lastToolCall = activeConversation.messages
    .flatMap((m) => m.toolCalls || [])
    .filter((tc) => tc.status === 'success')
    .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0]

  const duration = lastToolCall ? (lastToolCall.endTime || 0) - lastToolCall.startTime : 0

  return (
    <div className="w-[300px] border-l border-border bg-card p-4 hidden lg:flex flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          {/* Last Tool Call */}
          {lastToolCall && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <div className="p-3 bg-muted/50 rounded-lg">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      {t('last_tool', language)}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    <code className="font-mono text-xs">{lastToolCall.name}</code>
                  </div>

                  {duration > 0 ? (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-xs">{formatDuration(duration)}</span>
                    </div>
                  ) : null}

                  {lastToolCall.result ? (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Response</p>
                      <div className="bg-card p-2 rounded border border-border">
                        <pre className="font-mono text-xs text-foreground whitespace-pre-wrap break-words max-h-32 overflow-auto">
                          {String(JSON.stringify(lastToolCall.result, null, 2))}
                        </pre>
                      </div>
                    </div>
                  ) : null}
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Metadata Badges */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {language === 'en' ? 'Metadata' : 'Métadonnées'}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs gap-1">
                <Database className="w-3 h-3" />
                {t('data_source', language)}
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <Zap className="w-3 h-3" />
                {t('model', language)}
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              {language === 'en' ? 'Conversation Stats' : 'Statistiques'}
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Messages</span>
                <span className="font-semibold">{activeConversation.messages.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tools Called</span>
                <span className="font-semibold">
                  {activeConversation.messages.reduce((acc, m) => acc + (m.toolCalls?.length || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Language</span>
                <span className="font-semibold uppercase">{language}</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
