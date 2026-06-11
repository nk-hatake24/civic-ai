// hooks/useChat.ts
'use client'

import { useState, useCallback, useRef } from 'react'
import { useChatStore } from '@/store'
import { getErrorMessage } from '@/lib/utils'

export function useChat(conversationId: string | null) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeEventSource = useRef<EventSource | null>(null)
  
  const { addMessage, updateMessage, language } = useChatStore()

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || !content.trim()) return

    if (activeEventSource.current) {
      activeEventSource.current.close()
    }

    setError(null)
    setIsLoading(true)

    // Flag pour éviter d'afficher "Connection lost" si la fermeture est normale
    let isStreamCompleted = false

    try {
      // 1. Déclenchement du job d'IA
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversation_id: conversationId,
          language,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'upstream')
      }

      const { job_id } = await response.json()

      // 2. Initialisation du message de l'assistant (avec animation d'attente)
      const assistantMessageId = addMessage(conversationId, {
        conversationId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
        toolCalls: [],
        dataCards: [],
        sources: []
      })

      // 3. Écoute du flux SSE
      const eventSource = new EventSource(`/api/chat/stream/${job_id}`)
      activeEventSource.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          if (!event.data) return
          const payload = JSON.parse(event.data)

          // Cas A : Statut de réflexion de l'IA
          if (payload.type === 'status') {
            const statusText = typeof payload.data === 'string' 
              ? payload.data 
              : (payload.data?.message || 'AI is thinking...')

            updateMessage(conversationId, assistantMessageId, {
              content: `*${statusText}*`,
              isStreaming: true,
            })
          }

          // Cas B : Déclenchement d'un outil MCP (facultatif mais recommandé)
          if (payload.type === 'tool_start') {
            const toolName = payload.data || 'Calling tool...'
            updateMessage(conversationId, assistantMessageId, {
              content: `*Executing: ${toolName}...*`,
              isStreaming: true,
            })
          }

          // Cas C : Réception de la réponse finale complète
          if (payload.type === 'final_answer') {
            isStreamCompleted = true
            
            const finalText = typeof payload.data === 'string' 
              ? payload.data 
              : (payload.data?.text || '')

            const sourceModel = payload.data?.source ? `\n\n*Source: ${payload.data.source}*` : ''

            updateMessage(conversationId, assistantMessageId, {
              content: finalText + sourceModel,
              isStreaming: false,
              // Permet d'injecter des graphiques ou des logs d'outils si retournés
              toolCalls: payload.toolCalls || [], 
              dataCards: payload.dataCards || [],
            })

            eventSource.close()
            setIsLoading(false)
          }
        } catch (e) {
          console.error("Failed to parse stream payload:", e)
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
        setIsLoading(false)
        
        // On n'affiche l'erreur que si la connexion s'est coupée avant la fin attendue
        if (!isStreamCompleted) {
          updateMessage(conversationId, assistantMessageId, {
            content: "[Connection lost with backend stream server]",
            isStreaming: false
          })
        }
      }

    } catch (err: any) {
      setError(getErrorMessage(err.message || 'network', language))
      setIsLoading(false)
    }
  }, [conversationId, language, addMessage, updateMessage])

  return { sendMessage, isLoading, error }
}