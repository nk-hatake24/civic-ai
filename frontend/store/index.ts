// store/index.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { ChatStore, Conversation, Language, Message } from '@/lib/types'

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export const useChatStore = create<ChatStore>()(
  persist(
    immer((set, get) => ({
      conversations: [],
      activeConversationId: null,
      language: 'en',

      createConversation: (title?: string) => {
        const id = generateId()
        const now = Date.now()
        const conversation: Conversation = {
          id,
          title: title || `Conversation ${new Date(now).toLocaleDateString()}`,
          createdAt: now,
          updatedAt: now,
          messages: [],
          language: get().language,
        }

        set((state) => {
          state.conversations.unshift(conversation)
          state.activeConversationId = id
        })

        return id
      },

      addMessage: (conversationId: string, message: Omit<Message, 'id'>) => {
        const messageId = generateId()
        set((state) => {
          const conversation = state.conversations.find((c) => c.id === conversationId)
          if (conversation) {
            conversation.messages.push({
              ...message,
              id: messageId,
            })
            conversation.updatedAt = Date.now()
          }
        })
        return messageId
      },

      updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => {
        set((state) => {
          const conversation = state.conversations.find((c) => c.id === conversationId)
          if (conversation) {
            const message = conversation.messages.find((m) => m.id === messageId)
            if (message) {
              Object.assign(message, updates)
              conversation.updatedAt = Date.now()
            }
          }
        })
      },

      setActiveConversation: (conversationId: string | null) => {
        set((state) => {
          state.activeConversationId = conversationId
        })
      },

      setLanguage: (language: Language) => {
        set((state) => {
          state.language = language
        })
      },

      deleteConversation: (conversationId: string) => {
        set((state) => {
          state.conversations = state.conversations.filter((c) => c.id !== conversationId)
          if (state.activeConversationId === conversationId) {
            state.activeConversationId = state.conversations[0]?.id || null
          }
        })
      },

      renameConversation: (conversationId: string, newTitle: string) => {
        set((state) => {
          const conversation = state.conversations.find((c) => c.id === conversationId)
          if (conversation) {
            conversation.title = newTitle
            conversation.updatedAt = Date.now()
          }
        })
      },

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get()
        return conversations.find((c) => c.id === activeConversationId) || null
      },

      getConversation: (conversationId: string) => {
        const { conversations } = get()
        return conversations.find((c) => c.id === conversationId) || null
      },
    })),
    {
      name: 'civicai-store',
      version: 1,
      // Use dynamic storage key based on user to isolate chat data per user
      storage:
        typeof window === 'undefined'
          ? {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
          : {
              getItem: (key: string) => {
                const authStoreStr = localStorage.getItem('auth-store')
                let userId = 'guest'

                try {
                  const authStore = JSON.parse(authStoreStr || '{}')
                  if (authStore.state?.user?.id) {
                    userId = authStore.state.user.id
                  }
                } catch (e) {
                  // Fall back to guest
                }

                const storageKey = `civicai-store-${userId}`
                return localStorage.getItem(storageKey)
              },
              setItem: (key: string, value: string) => {
                const authStoreStr = localStorage.getItem('auth-store')
                let userId = 'guest'

                try {
                  const authStore = JSON.parse(authStoreStr || '{}')
                  if (authStore.state?.user?.id) {
                    userId = authStore.state.user.id
                  }
                } catch (e) {
                  // Fall back to guest
                }

                const storageKey = `civicai-store-${userId}`
                localStorage.setItem(storageKey, value)
              },
              removeItem: (key: string) => {
                const authStoreStr = localStorage.getItem('auth-store')
                let userId = 'guest'

                try {
                  const authStore = JSON.parse(authStoreStr || '{}')
                  if (authStore.state?.user?.id) {
                    userId = authStore.state.user.id
                  }
                } catch (e) {
                  // Fall back to guest
                }

                const storageKey = `civicai-store-${userId}`
                localStorage.removeItem(storageKey)
              },
            } as any,
    },
  ),
)
