"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import { createClient } from "@/lib/supabase/client"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { toast } from "sonner"

const MIN_TITLE_LENGTH = 10
const MAX_TITLE_LENGTH = 200
const MIN_CONTENT_LENGTH = 20
const MAX_CONTENT_LENGTH = 10000

interface Post {
  id: string
  title: string
  content: string
}

interface Tag {
  id: string
  name: string
}

interface EditPostFormProps {
  post: Post
  existingTags: Tag[]
}

export function EditPostForm({ post, existingTags }: EditPostFormProps) {
  const [title, setTitle] = useState(post.title)
  const [content, setContent] = useState(post.content)
  const [tags, setTags] = useState(existingTags.map(t => t.name).join(", "))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Update post
      const { error: postError } = await supabase
        .from("posts")
        .update({
          title,
          content,
          updated_at: new Date().toISOString()
        })
        .eq("id", post.id)

      if (postError) throw postError

      // Handle tags
      // Delete existing tag associations
      await supabase.from("post_tags").delete().eq("post_id", post.id)

      // Process tags if provided
      if (tags.trim()) {
        const tagNames = parsedTags

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

      toast.success("Пост успешно обновлен!", {
        description: "Переход на страницу поста..."
      })
      router.push(`/post/${post.id}`)
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Произошла ошибка"
      setError(errorMessage)
      toast.error("Ошибка при обновлении поста", {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Редактирование поста</CardTitle>
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
            {titleError && (
              <p className="text-sm text-destructive">Минимальная длина заголовка: {MIN_TITLE_LENGTH} символов</p>
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
            {contentError && (
              <p className="text-sm text-destructive">Минимальная длина содержания: {MIN_CONTENT_LENGTH} символов</p>
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

          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={isLoading || titleError || contentError || title.length < MIN_TITLE_LENGTH || content.length < MIN_CONTENT_LENGTH}
              className="min-w-[120px]"
            >
              {isLoading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push(`/post/${post.id}`)} disabled={isLoading}>
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
