"use client"

import { useRealtime } from "./use-realtime"
import type { DirectMessage } from "@/lib/api/messages"

interface UseMessagesRealtimeOptions {
  userId: string | undefined
  enabled?: boolean
  onNewMessage?: (message: DirectMessage) => void
  onMessagesChange?: () => void
}

/**
 * Хук для подписки на изменения сообщений в realtime
 */
export function useMessagesRealtime({
  userId,
  enabled = true,
  onNewMessage,
  onMessagesChange,
}: UseMessagesRealtimeOptions) {
  // ✅ Всегда вызываем хук, но передаём undefined filter если не enabled
  const shouldEnable = !!(userId && enabled)
  
  useRealtime<DirectMessage>({
    table: "direct_messages",
    filter: shouldEnable ? `receiver_id=eq.${userId}` : undefined,
    onInsert: (message) => {
      if (!shouldEnable) return
      onNewMessage?.(message)
      onMessagesChange?.()
    },
    onUpdate: ({ new: message }) => {
      if (!shouldEnable) return
      onMessagesChange?.()
    },
  })
}
