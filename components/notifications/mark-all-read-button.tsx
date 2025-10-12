"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function MarkAllReadButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleMarkAllRead = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false)

      router.refresh()
    } catch (error) {
      console.error("[v0] Error marking all as read:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm"
      className="h-9"
      onClick={handleMarkAllRead} 
      disabled={isLoading}
    >
      {isLoading ? "..." : "Отметить все"}
    </Button>
  )
}
