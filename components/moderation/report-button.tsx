"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Flag, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface ReportButtonProps {
  contentType: "post" | "comment"
  contentId: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

const REPORT_REASONS = [
  { value: "spam", label: "Спам или реклама" },
  { value: "harassment", label: "Домогательство или оскорбления" },
  { value: "hate_speech", label: "Разжигание ненависти" },
  { value: "violence", label: "Насилие или угрозы" },
  { value: "misinformation", label: "Дезинформация" },
  { value: "illegal", label: "Незаконный контент" },
  { value: "nsfw", label: "NSFW контент" },
  { value: "copyright", label: "Нарушение авторских прав" },
  { value: "other", label: "Другое" },
]

export function ReportButton({ contentType, contentId, size = "sm", variant = "ghost" }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Выберите причину жалобы")
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("Необходима авторизация")
        return
      }

      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        content_type: contentType,
        content_id: contentId,
        reason,
        description,
      })

      if (error) throw error

      toast.success("Жалоба отправлена", {
        description: "Модераторы рассмотрят вашу жалобу в ближайшее время"
      })
      
      setOpen(false)
      setReason("")
      setDescription("")
    } catch (error) {
      console.error("Error submitting report:", error)
      toast.error("Ошибка при отправке жалобы")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Flag className="h-4 w-4 mr-2" />
          Пожаловаться
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Пожаловаться на {contentType === "post" ? "пост" : "комментарий"}</DialogTitle>
          <DialogDescription>
            Расскажите нам, что не так с этим контентом. Мы рассмотрим вашу жалобу как можно скорее.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Причина *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите причину" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Дополнительная информация (опционально)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите проблему подробнее..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{description.length}/500</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={isLoading || !reason} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                "Отправить жалобу"
              )}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
