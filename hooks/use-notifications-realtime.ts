"use client"

import { useRealtime } from "./use-realtime"
import type { Notification } from "@/lib/types"

interface UseNotificationsRealtimeOptions {
  userId: string
  onNewNotification?: (notification: Notification) => void
  onUpdateNotification?: (notification: Notification) => void
  onNotificationsChange?: () => void
}

/**
 * Хук для подписки на изменения уведомлений в realtime
 */
export function useNotificationsRealtime({
  userId,
  onNewNotification,
  onUpdateNotification,
  onNotificationsChange,
}: UseNotificationsRealtimeOptions) {
  useRealtime<Notification>({
    table: "notifications",
    filter: `user_id=eq.${userId}`,
    onInsert: (notification) => {
      onNewNotification?.(notification)
      onNotificationsChange?.()
    },
    onUpdate: ({ new: notification }) => {
      onUpdateNotification?.(notification)
      onNotificationsChange?.()
    },
  })
}
