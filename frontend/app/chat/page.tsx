'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/store'
import { useChat } from '@/hooks/useChat'
import { SuggestedPrompts } from '@/components/chat/SuggestedPrompts'
import { MessageInput } from '@/components/chat/MessageInput'
import { t } from '@/lib/i18n'

function DirectMessageForm({ onSubmit, isLoading, language }: { onSubmit: (msg: string) => void; isLoading: boolean; language: 'en' | 'fr' }) {
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    if (message.trim()) {
      onSubmit(message)
      setMessage('')
    }
  }

  return (
    <div className="relative z-10 w-full max-w-lg px-4 pb-4">
      <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border p-4">
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase">
          {language === 'en' ? 'Or ask directly' : 'Ou posez une question'}
        </p>
        <div className="space-y-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={language === 'en' ? 'Type your question here...' : 'Tapez votre question ici...'}
            className="w-full min-h-12 p-3 rounded-md border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey && !isLoading) {
                handleSubmit()
              }
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !message.trim()}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            {isLoading ? (language === 'en' ? 'Sending...' : 'Envoi...') : language === 'en' ? 'Send' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const router = useRouter()
  const language = useChatStore((state) => state.language)
  const createConversation = useChatStore((state) => state.createConversation)
  const addMessage = useChatStore((state) => state.addMessage)
  const [isLoading, setIsLoading] = useState(false)

  const handlePromptSelect = (prompt: string) => {
    const conversationId = createConversation(prompt.substring(0, 50) + '...')
    // Navigate to the conversation page to show the ChatPanel
    router.push(`/chat/${conversationId}`)
  }

  const handleDirectMessage = async (message: string) => {
    if (!message.trim()) return

    setIsLoading(true)
    try {
      // Create a new conversation with the message as title
      const conversationId = createConversation(message.substring(0, 50) + '...')

      // Add the user message to the conversation
      addMessage(conversationId, {
        role: 'user',
        content: message,
        timestamp: Date.now(),
        sources: [],
        toolCalls: [],
      })

      // Navigate to the conversation page
      router.push(`/chat/${conversationId}`)
    } catch (error) {
      console.error('Error creating conversation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Geometric pattern SVG
  const geometricPattern = (
    <svg
      className="absolute inset-0 opacity-5"
      viewBox="0 0 400 400"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
        <pattern id="circles" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="400" height="400" fill="url(#grid)" />
      <rect width="400" height="400" fill="url(#circles)" opacity="0.3" />
      <polygon points="200,50 350,150 300,350 100,350 50,150" fill="none" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  )

  return (
    <div className="flex-1 flex flex-col items-center justify-between relative overflow-hidden py-8">
      {/* Background Pattern */}
      <div className="text-primary absolute inset-0">
        {geometricPattern}
      </div>

      {/* Top Content */}
      <div className="relative z-10 text-center max-w-lg px-4">
        {/* Logo */}
        <h1 className="text-6xl font-display font-semibold text-primary mb-2 text-balance">
          CivicAI
        </h1>

        {/* Gold Accent Line */}
        <div className="w-16 h-1 bg-accent mx-auto mb-6" />

        {/* Tagline */}
        <p className="text-lg text-foreground mb-8 text-pretty">
          {t('civicai_tagline', language)}
        </p>

        {/* Suggested Prompts */}
        <div>
          <p className="text-sm text-muted-foreground mb-4 font-semibold uppercase">
            {t('suggested_prompts', language)}
          </p>
          <SuggestedPrompts onSelect={handlePromptSelect} language={language} />
        </div>
      </div>

      {/* Direct Message Input Section */}
      <DirectMessageForm 
        onSubmit={handleDirectMessage} 
        isLoading={isLoading} 
        language={language} 
      />
    </div>
  )
}
