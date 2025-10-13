"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Save, FileText } from "lucide-react"
import { toast } from "sonner"
import { DraftList, useAutoSave, useDraftManager, type Draft } from "./draft-manager"
import { ImageUploader } from "@/components/media/image-uploader"
import { VoiceRecorder } from "@/components/media/voice-recorder"

const MIN_TITLE_LENGTH = 1
const MAX_TITLE_LENGTH = 200
const MIN_CONTENT_LENGTH = 0
const MAX_CONTENT_LENGTH = 10000

export function CreatePostForm() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
  const router = useRouter()
  const { deleteDraft } = useDraftManager()
  
  // Auto-save draft
  const { lastSaved } = useAutoSave(
    { title, content, tags },
    !isLoading && (title.length > 0 || content.length > 0)
  )

  const parsedTags = useMemo(() => {
    return tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
  }, [tags])

  const removeTag = (tagToRemove: string) => {
    const newTags = parsedTags.filter((t) => t !== tagToRemove)
    setTags(newTags.join(", "))
  }

  const loadDraft = (draft: Draft) => {
    setTitle(draft.title)
    setContent(draft.content)
    setTags(draft.tags)
    setCurrentDraftId(draft.id)
    toast.success("Черновик загружен")
  }

  const titleError = title.length > 0 && title.length < MIN_TITLE_LENGTH
  const contentError = content.length > 0 && content.length < MIN_CONTENT_LENGTH

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser()
      
      if (authError) {
        console.error("Auth error:", authError)
        throw new Error("Ошибка авторизации")
      }
      
      if (!user) {
        toast.error("Необходима авторизация")
        router.push("/login")
        return
      }

      // Create post
      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          title: title.trim(),
          content: content.trim(),
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          audio_url: audioUrl || null,
        })
        .select()
        .single()

      if (postError) {
        console.error("Post creation error:", {
          message: postError.message,
          details: postError.details,
          hint: postError.hint,
          code: postError.code
        })
        throw new Error(postError.message || "Ошибка при создании поста")
      }

      // Process tags if provided
      if (tags.trim()) {
        const tagNames = tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)

        for (const tagName of tagNames) {
          // Get or create tag
          let { data: tag } = await supabase.from("tags").select("*").eq("name", tagName).single()

          if (!tag) {
            const { data: newTag } = await supabase.from("tags").insert({ name: tagName }).select().single()
            tag = newTag
          }

          if (tag) {
            // Link tag to post
            await supabase.from("post_tags").insert({
              post_id: post.id,
              tag_id: tag.id,
            })
          }
        }
      }

      // Delete draft if it was loaded
      if (currentDraftId) {
        deleteDraft(currentDraftId)
      }
      
      toast.success("Пост успешно опубликован!", {
        description: "Переход на страницу поста..."
      })
      router.push(`/post/${post.id}`)
      router.refresh()
    } catch (error: any) {
      console.error("Error creating post:", {
        error,
        message: error?.message,
        details: error?.details,
        stack: error?.stack
      })
      
      const errorMessage = error?.message || "Произошла ошибка"
      setError(errorMessage)
      toast.error("Ошибка при создании поста", {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Tabs defaultValue="create" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="create">
          <FileText className="h-4 w-4 mr-2" />
          Новый пост
        </TabsTrigger>
        <TabsTrigger value="drafts">
          <Save className="h-4 w-4 mr-2" />
          Черновики
        </TabsTrigger>
      </TabsList>

      <TabsContent value="create">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Создайте новый пост</CardTitle>
              {lastSaved && (
                <span className="text-sm text-muted-foreground">
                  Сохранено {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Заголовок *</Label>
              <span className={`text-sm ${title.length > MAX_TITLE_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                {title.length}/{MAX_TITLE_LENGTH}
              </span>
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
              placeholder="Введите заголовок поста"
              required
              className={titleError ? "border-destructive" : ""}
            />
            {titleError && title.length > 0 && (
              <p className="text-sm text-destructive">Заголовок обязателен</p>
            )}
          </div>

          <div className="space-y-2">
            <MarkdownEditor
              id="content"
              value={content}
              onChange={setContent}
              placeholder="Напишите содержание поста... (поддерживается Markdown)"
              rows={12}
              error={contentError}
              maxLength={MAX_CONTENT_LENGTH}
            />
            {contentError && content.length > 0 && (
              <p className="text-sm text-muted-foreground">Содержимое опционально (можно добавить только изображения или аудио)</p>
            )}
            <p className="text-xs text-muted-foreground">
              Совет: Используйте Markdown для форматирования текста
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Теги (опционально)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="javascript, react, nextjs"
            />
            {parsedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {parsedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground">Разделяйте теги запятыми</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Изображения (опционально)</Label>
              <ImageUploader
                onUpload={setMediaUrls}
                maxImages={5}
                existingImages={mediaUrls}
              />
            </div>

            <div className="space-y-2">
              <Label>Голосовое сообщение (опционально)</Label>
              <VoiceRecorder
                onUpload={setAudioUrl}
                existingAudio={audioUrl || undefined}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={isLoading || title.length < MIN_TITLE_LENGTH}
              className="min-w-[120px]"
            >
              {isLoading ? "Публикация..." : "Опубликовать"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/feed")} disabled={isLoading}>
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
      </TabsContent>

      <TabsContent value="drafts">
        <DraftList onLoad={loadDraft} />
      </TabsContent>
    </Tabs>
  )
}
