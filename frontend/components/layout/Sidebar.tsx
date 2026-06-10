'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/store'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PlusCircle, Trash2, MoreVertical, LogOut } from 'lucide-react'

export function Sidebar() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  
  const {
    conversations,
    activeConversationId,
    language,
    createConversation,
    setActiveConversation,
    deleteConversation,
    renameConversation,
    setLanguage,
  } = useChatStore()

  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)

  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [renameDialog, setRenameDialog] = useState<{ id: string; title: string } | null>(null)
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleDelete = () => {
    if (deleteDialog) {
      deleteConversation(deleteDialog)
      setDeleteDialog(null)
    }
  }

  const handleRename = () => {
    if (renameDialog && newTitle.trim()) {
      renameConversation(renameDialog.id, newTitle)
      setRenameDialog(null)
      setNewTitle('')
    }
  }

  // Server-side skeleton
  if (!isHydrated) {
    return (
      <div className="w-[260px] border-r border-border bg-sidebar flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <h1 className="text-2xl font-display font-semibold text-primary">CivicAI</h1>
        </div>
        <div className="p-4 border-b border-border">
          <div className="h-10 bg-muted/50 rounded" />
        </div>
        <div className="flex-1 p-2 space-y-2">
          <div className="h-12 bg-muted/50 rounded" />
          <div className="h-12 bg-muted/50 rounded" />
          <div className="h-12 bg-muted/50 rounded" />
        </div>
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 h-8 bg-muted/50 rounded" />
            <div className="flex-1 h-8 bg-muted/50 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="w-[260px] border-r border-border bg-sidebar flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <h1 className="text-2xl font-display font-semibold text-primary">CivicAI</h1>
        </div>

        {/* New Conversation Button */}
        <div className="p-4 border-b border-border">
          <Button
            onClick={() => createConversation()}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            {t('new_conversation', language)}
          </Button>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center py-8 px-4 text-muted-foreground text-sm">
                {language === 'en' ? 'No conversations yet' : 'Aucune conversation'}
              </div>
            ) : (
              conversations.map((conversation, index) => (
                <div
                  key={conversation.id}
                  className="animate-sidebar-item"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
                      activeConversationId === conversation.id
                        ? 'bg-primary/10 border-l-2 border-primary'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => setActiveConversation(conversation.id)}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-sm truncate text-foreground">
                        {conversation.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          const date = new Date(conversation.updatedAt)
                          const month = date.toLocaleDateString(
                            language === 'fr' ? 'fr-FR' : 'en-US',
                            { month: 'short' }
                          )
                          const day = date.getDate()
                          return `${month} ${day}`
                        })()}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setRenameDialog({ id: conversation.id, title: conversation.title })
                            setNewTitle(conversation.title)
                          }}
                        >
                          {language === 'en' ? 'Rename' : 'Renommer'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteDialog(conversation.id)
                          }}
                          className="text-destructive"
                        >
                          {language === 'en' ? 'Delete' : 'Supprimer'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Language Toggle & Avatar */}
        <Separator />
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex gap-2">
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setLanguage('en')}
            >
              EN
            </Button>
            <Button
              variant={language === 'fr' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setLanguage('fr')}
            >
              FR
            </Button>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {language === 'en' ? 'EN' : 'FR'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium truncate">
              {language === 'en' ? 'English' : 'Français'}
            </span>
          </div>

          {/* User Info & Logout */}
          <Separator className="my-2" />
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 py-1">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs font-medium">
                  {user?.name.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-foreground">{user?.name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
            >
              <LogOut className="w-3 h-3 mr-2" />
              {language === 'en' ? 'Log Out' : 'Déconnexion'}
            </Button>
          </div>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={!!renameDialog} onOpenChange={(open) => !open && setRenameDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Rename Conversation' : 'Renommer la Conversation'}</DialogTitle>
          </DialogHeader>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={language === 'en' ? 'New title...' : 'Nouveau titre...'}
            className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog(null)}>
              {language === 'en' ? 'Cancel' : 'Annuler'}
            </Button>
            <Button onClick={handleRename} className="bg-primary text-primary-foreground">
              {language === 'en' ? 'Rename' : 'Renommer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Delete Conversation' : 'Supprimer la Conversation'}</DialogTitle>
            <DialogDescription>
              {language === 'en'
                ? 'This action cannot be undone. The conversation will be permanently deleted.'
                : 'Cette action ne peut pas être annulée. La conversation sera supprimée définitivement.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              {language === 'en' ? 'Cancel' : 'Annuler'}
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'en' ? 'Delete' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
