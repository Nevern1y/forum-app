"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface TypingIndicatorProps {
  conversationId: string
  currentUserId: string
  otherUserName: string
  className?: string
}

export function TypingIndicator({
  conversationId,
  currentUserId,
  otherUserName,
  className,
}: TypingIndicatorProps) {
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.user_id !== currentUserId) {
          setIsTyping(true)
          setTimeout(() => setIsTyping(false), 3000)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId])

  if (!isTyping) return null

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground py-2", className)}>
      <span>{otherUserName} печатает</span>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  )
}

/**
 * Хук для отправки события печатания
 */
export function useTypingIndicator(conversationId: string | null, currentUserId: string) {
  const broadcastTyping = () => {
    if (!conversationId) return

    const supabase = createClient()
    const channel = supabase.channel(`typing:${conversationId}`)

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "typing",
          payload: { user_id: currentUserId },
        })
      }
    })

    // Отписываемся через секунду
    setTimeout(() => {
      supabase.removeChannel(channel)
    }, 1000)
  }

  return { broadcastTyping }
}
