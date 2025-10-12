"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ReportIssuePage() {
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      toast.success("Сообщение о проблеме отправлено", {
        description: "Мы рассмотрим вашу проблему в ближайшее время",
      })

      setSubject("")
      setCategory("")
      setDescription("")
    } catch (error) {
      toast.error("Не удалось отправить сообщение", {
        description: "Пожалуйста, попробуйте позже",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Сообщить о проблеме</h1>
          <p className="text-muted-foreground mt-2">
            Расскажите нам о проблеме, с которой вы столкнулись
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Опишите проблему</CardTitle>
            <CardDescription>
              Предоставьте как можно больше деталей, чтобы мы могли помочь вам быстрее
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Категория проблемы</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Ошибка в работе</SelectItem>
                    <SelectItem value="feature">Предложение функции</SelectItem>
                    <SelectItem value="account">Проблема с аккаунтом</SelectItem>
                    <SelectItem value="content">Проблема с контентом</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Тема</Label>
                <Input
                  id="subject"
                  placeholder="Кратко опишите проблему"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Подробное описание</Label>
                <Textarea
                  id="description"
                  placeholder="Опишите проблему подробно..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  required
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Отправка..." : "Отправить сообщение"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
