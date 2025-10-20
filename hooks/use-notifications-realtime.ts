"use client"

import { useRealtime } from "./use-realtime"
import type { Notification } from "@/lib/types"

interface UseNotificationsRealtimeOptions {
  userId: string | undefined
  enabled?: boolean
  onNewNotification?: (notification: Notification) => void
  onUpdateNotification?: (notification: Notification) => void
  onNotificationsChange?: () => void
}

/**
 * Хук для подписки на изменения уведомлений в realtime
 */
export function useNotificationsRealtime({
  userId,
  enabled = true,
  onNewNotification,
  onUpdateNotification,
  onNotificationsChange,
}: UseNotificationsRealtimeOptions) {
  // ✅ Всегда вызываем хук, но передаём пустой filter если не enabled
  // Это соблюдает правила React Hooks
  const shouldEnable = !!(userId && enabled)
  
  useRealtime<Notification>({
    table: "notifications",
    filter: shouldEnable ? `user_id=eq.${userId}` : undefined,
    onInsert: (notification) => {
      if (!shouldEnable) return
      onNewNotification?.(notification)
      onNotificationsChange?.()
    },
    onUpdate: ({ new: notification }) => {
      if (!shouldEnable) return
      onUpdateNotification?.(notification)
      onNotificationsChange?.()
    },
  })
}
