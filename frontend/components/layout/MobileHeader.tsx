'use client'

import { useChatStore } from '@/store'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from '@/components/layout/Sidebar'
import { Menu } from 'lucide-react'

export function MobileHeader() {
  const activeConversation = useChatStore((state) => state.getActiveConversation())
  const language = useChatStore((state) => state.language)

  return (
    <div className="flex items-center justify-between border-b border-border bg-card p-4 md:hidden">
      <Sheet>
        <SheetTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors">
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[260px]">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <h2 className="text-sm font-semibold text-foreground truncate flex-1 px-2 text-center">
        {activeConversation?.title || 'CivicAI'}
      </h2>

      <div className="text-xs font-semibold uppercase px-2 bg-muted rounded">
        {language}
      </div>
    </div>
  )
}
