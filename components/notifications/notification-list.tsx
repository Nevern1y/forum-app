"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCheck, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/lib/api/notifications"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface NotificationListProps {
  userId: string
  onNotificationsRead?: () => void
  onClose?: () => void
}

export function NotificationList({ userId, onNotificationsRead, onClose }: NotificationListProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadNotifications()
  }, [userId])

  async function loadNotifications() {
    setLoading(true)
    try {
      const data = await getNotifications(userId)
      setNotifications(data)
    } catch (error) {
      console.error("Error loading notifications:", error)
      toast.error("Ошибка загрузки уведомлений")
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAsRead(notificationId: string, link: string | null) {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
      if (onNotificationsRead) {
        onNotificationsRead()
      }
      if (link && onClose) {
        onClose()
      }
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  async function handleMarkAllAsRead() {
    setActionLoading("all")
    try {
      await markAllNotificationsAsRead(userId)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      if (onNotificationsRead) {
        onNotificationsRead()
      }
      toast.success("Все уведомления прочитаны")
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast.error("Ошибка")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(notificationId: string) {
    setActionLoading(notificationId)
    try {
      await deleteNotification(notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      toast.success("Уведомление удалено")
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast.error("Ошибка удаления")
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Уведомления</h3>
          {notifications.some((n) => !n.is_read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading === "all"}
              className="text-xs"
            >
              {actionLoading === "all" ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              Прочитать все
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Notifications List */}
      <ScrollArea className="flex-1 max-h-[500px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">Нет уведомлений</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const relatedUser = notification.related_user

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-accent/50 transition-colors relative group",
                    !notification.is_read && "bg-primary/5"
                  )}
                >
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      onClick={() => handleMarkAsRead(notification.id, notification.link)}
                      className="block"
                    >
                      <NotificationContent
                        notification={notification}
                        relatedUser={relatedUser}
                      />
                    </Link>
                  ) : (
                    <div onClick={() => handleMarkAsRead(notification.id, null)}>
                      <NotificationContent
                        notification={notification}
                        relatedUser={relatedUser}
                      />
                    </div>
                  )}

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(notification.id)}
                    disabled={actionLoading === notification.id}
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {actionLoading === notification.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>

                  {/* Unread Indicator */}
                  {!notification.is_read && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function NotificationContent({ notification, relatedUser }: any) {
  return (
    <div className="flex gap-3">
      {relatedUser && (
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={relatedUser.avatar_url || undefined} />
          <AvatarFallback className="text-sm">
            {relatedUser.display_name?.[0]?.toUpperCase() || relatedUser.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium line-clamp-2">{notification.title}</p>
        {notification.message && (
          <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: ru,
          })}
        </p>
      </div>
    </div>
  )
}
