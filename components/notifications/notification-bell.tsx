"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { NotificationList } from "./notification-list"
import {
  getUnreadNotificationsCount,
  subscribeToNotifications,
} from "@/lib/api/notifications"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (!userId) return

    loadUnreadCount()

    // Подписка на real-time обновления
    const unsubscribe = subscribeToNotifications(userId, (notification) => {
      setUnreadCount((prev) => prev + 1)
      toast(notification.title, {
        description: notification.message,
      })
    })

    return unsubscribe
  }, [userId])

  async function loadUser() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
    }
  }

  async function loadUnreadCount() {
    if (!userId) return
    try {
      const count = await getUnreadNotificationsCount(userId)
      setUnreadCount(count)
    } catch (error) {
      console.error("Error loading unread count:", error)
    }
  }

  function handleNotificationsRead() {
    setUnreadCount(0)
  }

  if (!userId) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 dark:bg-[#181818]" align="end">
        <NotificationList
          userId={userId}
          onNotificationsRead={handleNotificationsRead}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}
