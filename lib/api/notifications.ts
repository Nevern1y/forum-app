import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@/lib/types"

/**
 * Получить уведомления пользователя
 */
export async function getNotifications(userId: string, limit: number = 20) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      *,
      related_user:related_user_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error getting notifications:", error)
    return []
  }

  return data
}

/**
 * Получить количество непрочитанных уведомлений
 */
export async function getUnreadNotificationsCount(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("get_unread_notifications_count", {
    for_user_id: userId,
  })

  if (error) {
    console.error("Error getting unread notifications count:", error)
    return 0
  }

  return data as number
}

/**
 * Пометить уведомление как прочитанное
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)

  if (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

/**
 * Пометить все уведомления как прочитанные
 */
export async function markAllNotificationsAsRead(userId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) {
    console.error("Error marking all notifications as read:", error)
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
