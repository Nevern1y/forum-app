"use client"

import { useRealtime } from "./use-realtime"
import type { DirectMessage } from "@/lib/api/messages"

interface UseMessagesRealtimeOptions {
  userId: string
  onNewMessage?: (message: DirectMessage) => void
  onMessagesChange?: () => void
}

/**
 * Хук для подписки на изменения сообщений в realtime
 */
export function useMessagesRealtime({
  userId,
  onNewMessage,
  onMessagesChange,
}: UseMessagesRealtimeOptions) {
  useRealtime<DirectMessage>({
    table: "direct_messages",
    filter: `receiver_id=eq.${userId}`,
    onInsert: (message) => {
      onNewMessage?.(message)
      onMessagesChange?.()
    },
    onUpdate: ({ new: message }) => {
      onMessagesChange?.()
    },
  })
}
