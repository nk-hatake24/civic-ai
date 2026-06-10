// app/chat/[id]/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useChatStore } from '@/store'
import { ChatPanel } from '@/components/layout/ChatPanel'

export default function ChatDetailPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string

  const setActiveConversation = useChatStore((state) => state.setActiveConversation)
  const getConversation = useChatStore((state) => state.getConversation)

  useEffect(() => {
    const conversation = getConversation(conversationId)
    if (!conversation) {
      router.push('/chat')
      return
    }

    setActiveConversation(conversationId)
  }, [conversationId, setActiveConversation, getConversation, router])

  return <ChatPanel />
}
