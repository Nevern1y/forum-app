"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, Image as ImageIcon, Mic, X } from "lucide-react"
import { toast } from "sonner"
import { ImageUploader } from "@/components/media/image-uploader"
import { VoiceRecorder } from "@/components/media/voice-recorder"

interface CommentFormProps {
  postId: string
  parentId?: string | null
  onCancel?: () => void
  onSuccess?: () => void
}

const MIN_COMMENT_LENGTH = 3
const MAX_COMMENT_LENGTH = 2000

export function CommentForm({ postId, parentId = null, onCancel, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState("")
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const contentError = content.length > 0 && content.length < MIN_COMMENT_LENGTH

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Необходима авторизация")

      const { error: commentError } = await supabase.from("comments").insert({
        post_id: postId,
        author_id: user.id,
        parent_id: parentId,
        content,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        audio_url: audioUrl || null,
      })

      if (commentError) throw commentError

      setContent("")
      setMediaUrls([])
      setAudioUrl(null)
      setShowImageUploader(false)
      setShowVoiceRecorder(false)
      toast.success("Комментарий добавлен!")
      router.refresh()
      if (onSuccess) onSuccess()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Произошла ошибка"
      setError(errorMessage)
      toast.error("Ошибка при добавлении комментария", {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={parentId ? "border-primary/30 dark:bg-[#181818]" : "dark:bg-[#181818]"}>
      {!parentId && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Написать комментарий</CardTitle>
        </CardHeader>
      )}
      <CardContent className={parentId ? "pt-4" : ""}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="comment" className="sr-only">
                {parentId ? "Ответ" : "Комментарий"}
              </Label>
              <span className={`text-xs ml-auto ${content.length > MAX_COMMENT_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                {content.length}/{MAX_COMMENT_LENGTH}
              </span>
            </div>
            <Textarea
              id="comment"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
              placeholder={parentId ? "Написать ответ..." : "Поделитесь своим мнением..."}
              rows={parentId ? 3 : 4}
              required
              className={`resize-none ${contentError ? "border-destructive" : ""}`}
            />
            {contentError && (
              <p className="text-xs text-destructive">
                Минимальная длина: {MIN_COMMENT_LENGTH} символа
              </p>
            )}
          </div>

          {/* Media attachments preview */}
          {mediaUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mediaUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={url} 
                    alt={`Upload ${index + 1}`} 
                    className="h-16 w-16 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== index))}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Audio preview */}
          {audioUrl && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <Mic className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm flex-1">Голосовое сообщение прикреплено</span>
              <button
                type="button"
                onClick={() => setAudioUrl(null)}
                className="p-1 hover:bg-background rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Image uploader */}
          {showImageUploader && (
            <ImageUploader
              bucket="comment-images"
              onUpload={(urls) => {
                setMediaUrls(urls)
                setShowImageUploader(false)
              }}
              onCancel={() => setShowImageUploader(false)}
              maxImages={3}
              existingImages={mediaUrls}
            />
          )}

          {/* Voice recorder */}
          {showVoiceRecorder && (
            <VoiceRecorder
              bucket="comment-images"
              onUpload={(url) => {
                setAudioUrl(url)
                setShowVoiceRecorder(false)
              }}
              onCancel={() => setShowVoiceRecorder(false)}
              existingAudio={audioUrl || undefined}
            />
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-1">
              {!audioUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowImageUploader(!showImageUploader)}
                  disabled={isLoading || mediaUrls.length >= 3}
                  className="h-8 px-2"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              )}
              {!audioUrl && mediaUrls.length === 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                  disabled={isLoading}
                  className="h-8 px-2"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                  Отмена
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isLoading || contentError || content.length < MIN_COMMENT_LENGTH}
                className="gap-2"
              >
                {isLoading ? (
                  "Отправка..."
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Отправить
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
