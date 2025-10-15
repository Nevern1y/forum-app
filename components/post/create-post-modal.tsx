"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ImageUploader } from "@/components/media/image-uploader"
import { VoiceRecorder } from "@/components/media/voice-recorder"

const MIN_TITLE_LENGTH = 1
const MAX_TITLE_LENGTH = 200
const MIN_CONTENT_LENGTH = 0
const MAX_CONTENT_LENGTH = 10000

interface CreatePostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePostModal({ open, onOpenChange }: CreatePostModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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

  const titleError = title.length > 0 && title.length < MIN_TITLE_LENGTH
  const contentError = content.length > 0 && content.length < MIN_CONTENT_LENGTH

  const resetForm = () => {
    setTitle("")
    setContent("")
    setTags("")
    setMediaUrls([])
    setAudioUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (title.length < MIN_TITLE_LENGTH) {
      toast.error('Заголовок обязателен')
      return
    }

    setIsLoading(true)

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
        onOpenChange(false)
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
          let { data: tag, error: tagSelectError } = await supabase
            .from("tags")
            .select("id")
            .eq("name", tagName)
            .maybeSingle()

          if (tagSelectError) {
            console.error("Tag select error:", tagSelectError)
            continue // Skip this tag but continue with others
          }

          if (!tag) {
            const { data: newTag, error: tagError } = await supabase
              .from("tags")
              .insert({ name: tagName })
              .select("id")
              .single()

            if (tagError) {
              console.error("Tag creation error:", tagError)
              continue // Skip this tag but continue with others
            }
            tag = newTag
          }

          if (tag?.id) {
            const { error: postTagError } = await supabase.from("post_tags").insert({
              post_id: post.id,
              tag_id: tag.id,
            })

            if (postTagError) {
              console.error("Post tag link error:", postTagError)
              // Continue anyway, tags are optional
            }
          }
        }
      }

      toast.success("Пост успешно создан!")
      resetForm()
      onOpenChange(false)
      router.push(`/post/${post.id}`)
      router.refresh()
    } catch (err: any) {
      console.error("Error creating post:", {
        error: err,
        message: err?.message,
        details: err?.details,
        stack: err?.stack
      })
      
      const errorMessage = err?.message || "Не удалось создать пост"
      toast.error(errorMessage, {
        description: "Попробуйте еще раз или обратитесь в поддержку"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto bg-gradient-to-b from-background via-background to-muted/5">
        <DialogHeader className="border-b border-border/50 pb-3 md:pb-4">
          <DialogTitle className="text-lg md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-xl md:text-2xl">✍️</span>
            Создать пост
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">
              Заголовок <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="О чем ваш пост?"
              maxLength={MAX_TITLE_LENGTH}
              className={titleError ? "border-destructive" : ""}
            />
            <div className="flex items-center justify-between text-xs">
              {titleError && title.length === 0 && (
                <p className="text-destructive">Заголовок обязателен</p>
              )}
              <p className={`ml-auto ${title.length > MAX_TITLE_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground"}`}>
                {title.length}/{MAX_TITLE_LENGTH}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              Содержимое (опционально)
            </Label>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Напишите что-нибудь интересное..."
              className={contentError ? "border-destructive" : ""}
            />
            <div className="flex items-center justify-between text-xs">
              <p className="text-muted-foreground text-xs">
                Содержимое опционально - можно добавить только фото или аудио
              </p>
              <p className={`ml-auto ${content.length > MAX_CONTENT_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground"}`}>
                {content.length}/{MAX_CONTENT_LENGTH}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Теги</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="технологии, программирование, новости (через запятую)"
            />
            {parsedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {parsedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <ImageUploader
              onUpload={(urls) => setMediaUrls(urls)}
              maxImages={5}
              existingImages={mediaUrls}
            />

            <VoiceRecorder
              onUpload={(url) => setAudioUrl(url)}
              existingAudio={audioUrl || undefined}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border/50">
            <button
              type="button"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
              disabled={isLoading}
              className="flex-1 px-5 py-3 text-sm font-semibold rounded-full border-2 border-border/50 bg-background hover:bg-muted hover:border-border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading || !title}
              className="flex-1 px-5 py-3 text-sm font-semibold rounded-full bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Публикация...
                  </>
                ) : (
                  <>
                    <span className="mr-1">🚀</span>
                    Опубликовать
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
