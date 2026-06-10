'use client'

import { useChatStore } from '@/store'
import { useChat } from '@/hooks/useChat'
import { useAutoScroll } from '@/hooks/useAutoScroll'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { ToolExecutionCard } from '@/components/chat/ToolExecutionCard'
import { DataCard } from '@/components/chat/DataCard'
import { MessageInput } from '@/components/chat/MessageInput'
import { SuggestedPrompts } from '@/components/chat/SuggestedPrompts'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { t } from '@/lib/i18n'
import { useState, useEffect } from 'react'

export function ChatPanel() {
  const [isHydrated, setIsHydrated] = useState(false)
  const activeConversation = useChatStore((state) => state.getActiveConversation())
  const language = useChatStore((state) => state.language)
  const addMessage = useChatStore((state) => state.addMessage)
  const { sendMessage, isLoading, error } = useChat(activeConversation?.id || null)

  const scrollRef = useAutoScroll(activeConversation?.messages.length)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handlePromptSelect = (prompt: string) => {
    if (activeConversation?.id) {
      // Add user message with the prompt
      addMessage(activeConversation.id, {
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
        sources: [],
        toolCalls: [],
      })
      // Send the message
      sendMessage(prompt)
    }
  }

  if (!isHydrated) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        <div className="border-b border-border p-4 h-16 bg-card" />
        <div className="flex-1 p-4" />
      </div>
    )
  }

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">
            {language === 'en' ? 'Select or create a conversation to start' : 'Sélectionnez ou créez une conversation pour commencer'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between bg-card">
        <h2 className="text-lg font-semibold text-foreground truncate">
          {activeConversation.title}
        </h2>
        <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
          {t('powered_by', language)}
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-2xl mx-auto w-full space-y-4">
          {activeConversation.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full py-8 space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-6">
                  {language === 'en' ? 'Start with a suggestion or ask your own question' : 'Commencez par une suggestion ou posez votre propre question'}
                </p>
              </div>
              <SuggestedPrompts onSelect={handlePromptSelect} language={language} />
            </div>
          ) : (
            <>
              {activeConversation.messages.map((message) => (
                <div key={message.id}>
                  <MessageBubble message={message} />

                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="ml-11 space-y-2">
                      {message.toolCalls.map((toolCall) => (
                        <ToolExecutionCard key={toolCall.id} toolCall={toolCall} />
                      ))}
                    </div>
                  )}

                  {message.dataCards && message.dataCards.length > 0 && (
                    <div className="ml-11 space-y-2">
                      {message.dataCards.map((dataCard) => (
                        <DataCard key={dataCard.id} dataCard={dataCard} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={scrollRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="max-w-2xl mx-auto w-full">
          <MessageInput
            onSend={sendMessage}
            isLoading={isLoading}
            language={language}
          />
        </div>
      </div>
    </div>
  )
}
