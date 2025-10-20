import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@/lib/types"

/**
 * Notifications API with Context7 Best Practices
 * - Explicit filters for better query plans
 * - Limited columns selection
 * - Safe pagination
 */

/**
 * Получить уведомления пользователя
 * Context7 Optimization: Explicit filters + specific columns + safe limits
 */
export async function getNotifications(userId: string | undefined | null, limit: number = 20) {
  // Early return if no userId
  if (!userId || userId.trim() === '') {
    console.warn('[Notifications] getNotifications called without valid userId')
    return []
  }

  const supabase = createClient()

  // Context7: Safe limit
  const safeLimit = Math.min(limit, 100)

  try {
    // Context7: Select specific columns + explicit filter
    const { data, error } = await supabase
      .from("notifications")
      .select(
        `
        id,
        user_id,
        type,
        title,
        message,
        related_user_id,
        is_read,
        read_at,
        created_at,
        related_user:profiles!notifications_related_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq("user_id", userId) // Explicit filter!
      .order("created_at", { ascending: false })
      .limit(safeLimit) // Context7: Safe limit

    if (error) {
      console.error('[Notifications] Error getting notifications:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return []
    }

    return data || []
  } catch (err) {
    console.error('[Notifications] Unexpected error:', err)
    return []
  }
}

/**
 * Получить количество непрочитанных уведомлений
 */
export async function getUnreadNotificationsCount(userId: string | undefined | null) {
  if (!userId || userId.trim() === '') {
    return 0
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc("get_unread_notifications_count", {
      for_user_id: userId,
    })

    if (error) {
      console.error('[Notifications] Error getting unread count:', {
        error,
        code: error.code,
        message: error.message,
      })
      return 0
    }

    return (data as number) || 0
  } catch (err) {
    console.error('[Notifications] Unexpected error in getUnreadCount:', err)
    return 0
  }
}

/**
 * Пометить уведомление как прочитанное
 * Context7 Optimization: Explicit filter
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = createClient()

  // Context7: Explicit filter for better query plan
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId) // Explicit filter!

  if (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

/**
 * Пометить все уведомления как прочитанные
 * Context7 Optimization: Multiple explicit filters
 */
export async function markAllNotificationsAsRead(userId: string | undefined | null) {
  if (!userId || userId.trim() === '') {
    throw new Error('Invalid userId')
  }

  const supabase = createClient()

  // Context7: Multiple explicit filters for better index usage
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)   // Explicit filter 1
    .eq("is_read", false)    // Explicit filter 2

  if (error) {
    console.error('[Notifications] Error marking all as read:', error)
    throw error
  }
}

/**
 * Удалить уведомление
 */
export async function deleteNotification(notificationId: string) {
  const supabase = createClient()

  const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

  if (error) {
    console.error("Error deleting notification:", error)
    throw error
  }
}

/**
 * Подписаться на real-time обновления уведомлений
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
) {
  const supabase = createClient()

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as Notification)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
