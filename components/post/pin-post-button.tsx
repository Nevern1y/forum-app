"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Pin, PinOff } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface PinPostButtonProps {
  postId: string
  isPinned: boolean
  isAuthor: boolean
}

export function PinPostButton({ postId, isPinned, isAuthor }: PinPostButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (!isAuthor) return null

  const handleTogglePin = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("posts")
        .update({ is_pinned: !isPinned })
        .eq("id", postId)

      if (error) throw error

      toast.success(isPinned ? "Пост откреплен" : "Пост закреплен")
      router.refresh()
    } catch (error) {
      console.error("Error toggling pin:", error)
      toast.error("Ошибка при изменении закрепления")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={isPinned ? "default" : "outline"}
      size="sm"
      onClick={handleTogglePin}
      disabled={loading}
    >
      {isPinned ? (
        <>
          <PinOff className="h-4 w-4 mr-2" />
          Открепить
        </>
      ) : (
        <>
          <Pin className="h-4 w-4 mr-2" />
          Закрепить
        </>
      )}
    </Button>
  )
}
