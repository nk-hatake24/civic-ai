// components/layout/ChatPanel.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useChatStore } from '@/store'
import { useChat } from '@/hooks/useChat'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { MessageInput } from '@/components/chat/MessageInput'
import { ToolExecutionCard } from '@/components/chat/ToolExecutionCard'
import { DataCard } from '@/components/chat/DataCard'

export function ChatPanel() {
  const searchParams = useSearchParams()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Référence pour bloquer les appels doubles de StrictMode par conversation
  const triggerTrackerRef = useRef<Record<string, boolean>>({})
  
  const activeId = useChatStore((state) => state.activeConversationId)
  const language = useChatStore((state) => state.language)
  const getConversation = useChatStore((state) => state.getConversation)
  
  const conversation = activeId ? getConversation(activeId) : null
  const { sendMessage, isLoading, error } = useChat(activeId)

  // Trigger de traitement au chargement de la page d'URL (avec protection anti-doublon)
  useEffect(() => {
    const trigger = searchParams.get('trigger')
    
    if (trigger === 'true' && activeId && conversation && conversation.messages.length > 0) {
      // Si cette conversation a déjà déclenché son premier message, on ignore les montages suivants
      if (triggerTrackerRef.current[activeId]) {
        return
      }

      const lastMessage = conversation.messages[conversation.messages.length - 1]
      if (lastMessage.role === 'user') {
        // Enregistrer immédiatement le déclenchement pour bloquer le double-effet de React
        triggerTrackerRef.current[activeId] = true
        sendMessage(lastMessage.content)
      }
    }
  }, [activeId, searchParams, conversation, sendMessage])

  // Défilement automatique lors de la réception des messages
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [conversation?.messages])

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Select or start a new conversation.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background relative overflow-hidden">
      
      {/* Zone Historique de discussion */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 scroll-smooth min-h-0"
      >
        <div className="max-w-3xl mx-auto space-y-6 pb-4">
          {conversation.messages.map((message) => (
            <div key={message.id} className="space-y-4">
              <MessageBubble message={message} />

              {/* logs outils MCP */}
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="space-y-2 max-w-2xl ml-12">
                  {message.toolCalls.map((tool) => (
                    <ToolExecutionCard key={tool.id} toolCall={tool} />
                  ))}
                </div>
              )}

              {/* graphiques / données structurées */}
              {message.dataCards && message.dataCards.length > 0 && (
                <div className="space-y-4 max-w-2xl ml-12">
                  {message.dataCards.map((card) => (
                    <DataCard key={card.id} dataCard={card} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Saisie Sticky */}
      <div className="p-4 border-t border-border bg-card flex-shrink-0 z-10 shadow-lg">
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="mb-3 p-3 text-xs bg-destructive/10 border border-destructive text-destructive rounded-lg">
              {error}
            </div>
          )}
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