export type Language = 'fr' | 'en'

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isStreaming?: boolean
  toolCalls?: ToolCall[]
  dataCards?: DataCard[]
   sources?: string[];
}


export interface ToolCall {
  id: string
  name: string
  status: 'calling' | 'success' | 'error'
  startTime: number
  endTime?: number
  input?: Record<string, unknown>
  result?: unknown
  error?: string
}

export interface DataCard {
  id: string
  title: string
  type: 'table' | 'stats'
  data: Record<string, unknown>[] | Record<string, unknown>
  source?: string
}

// export interface Conversation {
//   id: string
//   title: string
//   createdAt: number
//   updatedAt: number
//   messages: Message[]
//   language: Language
// }

export interface ChatResponse {
  id: string
  conversationId: string
  reply: string
  toolCalls?: ToolCall[]
  dataCards?: DataCard[]
  isStreaming: boolean
}

export interface ChatStoreState {
  conversations: Conversation[]
  activeConversationId: string | null
  language: Language
}

export interface ChatStoreActions {
  createConversation: (title?: string) => string
  addMessage: (conversationId: string, message: Omit<Message, 'id'>) => string
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void
  setActiveConversation: (conversationId: string | null) => void
  setLanguage: (language: Language) => void
  deleteConversation: (conversationId: string) => void
  renameConversation: (conversationId: string, newTitle: string) => void
  getActiveConversation: () => Conversation | null
  getConversation: (conversationId: string) => Conversation | null
}




export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  language: Language;
  createConversation: (title?: string) => string;
  addMessage: (conversationId: string, message: Omit<Message, 'id'>) => string;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  setActiveConversation: (conversationId: string | null) => void;
  setLanguage: (language: Language) => void;
  deleteConversation: (conversationId: string) => void;
  renameConversation: (conversationId: string, newTitle: string) => void;
  getActiveConversation: () => Conversation | null;
  getConversation: (conversationId: string) => Conversation | null;
}



//export type ChatStore = ChatStoreState & ChatStoreActions
