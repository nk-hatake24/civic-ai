'use client'

import { useState } from 'react'
import { useChatStore } from '@/store'
import { getErrorMessage } from '@/lib/utils'

export function useChat(conversationId: string | null) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { addMessage, updateMessage, language } = useChatStore()

  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim()) return

    setError(null)
    setIsLoading(true)

    try {
      // Add user message
      const userMessageId = addMessage(conversationId, {
        conversationId,
        role: 'user',
        content,
        timestamp: Date.now(),
      })

      // Create placeholder assistant message
      const assistantMessageId = addMessage(conversationId, {
        conversationId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      })

      // Call API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversation_id: conversationId,
          language,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorCode = errorData.error || 'upstream'

        if (response.status === 401) {
          setError(getErrorMessage('auth', language))
        } else if (response.status === 429) {
          setError(getErrorMessage('rate_limit', language))
        } else {
          setError(getErrorMessage(errorCode, language))
        }

        setIsLoading(false)
        return
      }

      const chatResponse = await response.json()

      // Update assistant message with response
      updateMessage(conversationId, assistantMessageId, {
        content: chatResponse.reply,
        isStreaming: false,
        toolCalls: chatResponse.toolCalls,
        dataCards: chatResponse.dataCards,
      })

      setIsLoading(false)
    } catch (err) {
      setError(getErrorMessage('network', language))
      setIsLoading(false)
    }
  }

  return {
    sendMessage,
    isLoading,
    error,
  }
}
