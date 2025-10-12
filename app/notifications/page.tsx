import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Bell, MessageSquare, ThumbsUp, UserPlus, AtSign } from "lucide-react"
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button"

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select(`
      *,
      related_user:related_user_id (username, display_name),
      related_post:related_post_id (id, title)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
        return <MessageSquare className="h-5 w-5" />
      case "like":
        return <ThumbsUp className="h-5 w-5" />
      case "follow":
        return <UserPlus className="h-5 w-5" />
      case "mention":
        return <AtSign className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h1 className="text-[24px] font-bold">Уведомления</h1>
            {unreadCount ? (
              <p className="text-[15px] text-muted-foreground">
                {unreadCount} {unreadCount === 1 ? 'новое' : 'новых'}
              </p>
            ) : (
              <p className="text-[15px] text-muted-foreground">Всё прочитано</p>
            )}
          </div>
          {unreadCount ? <MarkAllReadButton /> : null}
        </div>

        {!notifications || notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-4">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-[15px] font-medium mb-1">Нет уведомлений</p>
            <p className="text-[15px] text-muted-foreground">
              У вас пока нет новых уведомлений
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const relatedUser = notification.related_user
              const relatedPost = notification.related_post

              return (
                <Link
                  key={notification.id}
                  href={
                    relatedPost
                      ? `/post/${relatedPost.id}`
                      : relatedUser
                        ? `/profile/${relatedUser.username}`
                        : "/notifications"
                  }
                  className={`block py-4 hover:bg-muted/30 transition-colors -mx-4 px-4 ${
                    !notification.is_read ? 'bg-muted/20' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`shrink-0 ${notification.is_read ? "text-muted-foreground" : "text-foreground"}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] leading-relaxed mb-1">{notification.content}</p>
                      <time className="text-[13px] text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </time>
                    </div>
                    {!notification.is_read && (
                      <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
