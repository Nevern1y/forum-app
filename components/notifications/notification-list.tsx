"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCheck, Trash2, Bell, BellOff, Sparkles } from "lucide-react"
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
import type { Notification } from "@/lib/types"

interface NotificationListProps {
  userId: string
  onNotificationsRead?: () => void
  onClose?: () => void
}

export function NotificationList({ userId, onNotificationsRead, onClose }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
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

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">Уведомления</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading === "all"}
              className="text-xs h-8 hover:bg-primary/10"
            >
              {actionLoading === "all" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              )}
              Прочитать
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Notifications List */}
      <ScrollArea className="flex-1 max-h-[500px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 py-16 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <BellOff className="h-10 w-10 text-muted-foreground/50" />
              </div>
            </div>
            <h4 className="font-semibold text-base mb-1">Всё спокойно</h4>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              У вас пока нет новых уведомлений
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const relatedUser = notification.related_user

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3.5 hover:bg-accent/50 transition-all duration-200 relative group cursor-pointer",
                    !notification.is_read && "bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      onClick={() => handleMarkAsRead(notification.id, notification.link ?? null)}
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
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDelete(notification.id)
                    }}
                    disabled={actionLoading === notification.id}
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive"
                  >
                    {actionLoading === notification.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  {/* Unread Indicator */}
                  {!notification.is_read && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
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

interface NotificationContentProps {
  notification: Notification
  relatedUser?: {
    username: string
    display_name: string | null
    avatar_url?: string | null
  }
}

function NotificationContent({ notification, relatedUser }: NotificationContentProps) {
  return (
    <div className="flex gap-3">
      {relatedUser && (
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-background">
          <AvatarImage src={relatedUser.avatar_url || undefined} />
          <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary/20 to-primary/10">
            {relatedUser.display_name?.[0]?.toUpperCase() || relatedUser.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 min-w-0 space-y-1 pr-8">
        <p className="text-sm font-medium line-clamp-2 leading-snug">
          {notification.message || notification.content || notification.title}
        </p>
        <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/50" />
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: ru,
          })}
        </p>
      </div>
    </div>
  )
}
