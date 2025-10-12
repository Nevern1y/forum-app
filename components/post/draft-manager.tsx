"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { FileText, Trash2, Clock } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export interface Draft {
  id: string
  title: string
  content: string
  tags: string
  savedAt: string
}

const DRAFT_KEY = "forum_post_drafts"
const MAX_DRAFTS = 10
const AUTO_SAVE_DELAY = 3000

export function useDraftManager() {
  const [drafts, setDrafts] = useState<Draft[]>([])

  useEffect(() => {
    loadDrafts()
  }, [])

  const loadDrafts = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        setDrafts(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Error loading drafts:", error)
    }
  }

  const saveDraft = (draft: Omit<Draft, "id" | "savedAt">) => {
    try {
      const newDraft: Draft = {
        ...draft,
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString()
      }

      const saved = localStorage.getItem(DRAFT_KEY)
      let existingDrafts: Draft[] = saved ? JSON.parse(saved) : []
      
      existingDrafts = [newDraft, ...existingDrafts].slice(0, MAX_DRAFTS)
      
      localStorage.setItem(DRAFT_KEY, JSON.stringify(existingDrafts))
      setDrafts(existingDrafts)
      
      return newDraft.id
    } catch (error) {
      console.error("Error saving draft:", error)
      return null
    }
  }

  const updateDraft = (id: string, draft: Omit<Draft, "id" | "savedAt">) => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (!saved) return

      let existingDrafts: Draft[] = JSON.parse(saved)
      const index = existingDrafts.findIndex(d => d.id === id)
      
      if (index !== -1) {
        existingDrafts[index] = {
          ...draft,
          id,
          savedAt: new Date().toISOString()
        }
        
        localStorage.setItem(DRAFT_KEY, JSON.stringify(existingDrafts))
        setDrafts(existingDrafts)
      }
    } catch (error) {
      console.error("Error updating draft:", error)
    }
  }

  const deleteDraft = (id: string) => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (!saved) return

      let existingDrafts: Draft[] = JSON.parse(saved)
      existingDrafts = existingDrafts.filter(d => d.id !== id)
      
      localStorage.setItem(DRAFT_KEY, JSON.stringify(existingDrafts))
      setDrafts(existingDrafts)
    } catch (error) {
      console.error("Error deleting draft:", error)
    }
  }

  const getDraft = (id: string): Draft | null => {
    return drafts.find(d => d.id === id) || null
  }

  return {
    drafts,
    saveDraft,
    updateDraft,
    deleteDraft,
    getDraft
  }
}

interface DraftListProps {
  onLoad: (draft: Draft) => void
}

export function DraftList({ onLoad }: DraftListProps) {
  const { drafts, deleteDraft } = useDraftManager()

  if (drafts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-2">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">Нет сохраненных черновиков</p>
            <p className="text-sm text-muted-foreground">
              Черновики сохраняются автоматически при написании постов
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {drafts.map((draft) => (
        <Card key={draft.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold line-clamp-1 mb-1">
                  {draft.title || "Без заголовка"}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {draft.content.substring(0, 150)}...
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(draft.savedAt), {
                      addSuffix: true,
                      locale: ru
                    })}
                  </Badge>
                  {draft.tags && (
                    <Badge variant="secondary" className="text-xs">
                      {draft.tags.split(",").length} тегов
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onLoad(draft)}
                >
                  Загрузить
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить черновик?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Это действие нельзя отменить. Черновик будет удален навсегда.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteDraft(draft.id)}>
                        Удалить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Hook for auto-saving
export function useAutoSave(
  data: { title: string; content: string; tags: string },
  enabled: boolean = true
) {
  const { saveDraft } = useDraftManager()
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (!data.title && !data.content) return

    const timer = setTimeout(() => {
      const id = saveDraft(data)
      if (id) {
        setDraftId(id)
        setLastSaved(new Date())
      }
    }, AUTO_SAVE_DELAY)

    return () => clearTimeout(timer)
  }, [data.title, data.content, data.tags, enabled])

  return { lastSaved, draftId }
}
