import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { MessageSquare, FileText, ThumbsUp, UserPlus } from "lucide-react"

interface UserActivityProps {
  userId: string
  limit?: number
}

type Activity = {
  id: string
  type: "post" | "comment" | "like" | "follow"
  created_at: string
  content?: string
  title?: string
  post_id?: string
  target_username?: string
}

export async function UserActivity({ userId, limit = 10 }: UserActivityProps) {
  const supabase = await createClient()

  // Get recent posts
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, content, created_at")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  // Get recent comments
  const { data: comments } = await supabase
    .from("comments")
    .select("id, content, created_at, post_id, posts(id, title)")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  // Get recent subscriptions
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("created_at, profiles!subscriptions_following_id_fkey(username)")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  // Combine and sort all activities
  const activities: Activity[] = [
    ...(posts?.map(p => ({
      id: p.id,
      type: "post" as const,
      created_at: p.created_at,
      title: p.title,
      content: p.content,
      post_id: p.id
    })) || []),
    ...(comments?.map(c => ({
      id: c.id,
      type: "comment" as const,
      created_at: c.created_at,
      content: c.content,
      post_id: c.post_id,
      title: (c.posts as any)?.title
    })) || []),
    ...(subscriptions?.map(s => ({
      id: `sub-${s.created_at}`,
      type: "follow" as const,
      created_at: s.created_at,
      target_username: (s.profiles as any)?.username
    })) || [])
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  .slice(0, limit)

  if (activities.length === 0) {
    return (
      <Card className="border-dashed dark:bg-[#181818]">
        <CardContent className="pt-8 pb-8">
          <p className="text-center text-muted-foreground">
            Пока нет активности
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <Card key={`${activity.type}-${activity.id}-${index}`} className="hover:shadow-md transition-shadow dark:bg-[#181818]">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="shrink-0 p-2 rounded-full bg-muted">
                {activity.type === "post" && <FileText className="h-4 w-4" />}
                {activity.type === "comment" && <MessageSquare className="h-4 w-4" />}
                {activity.type === "like" && <ThumbsUp className="h-4 w-4" />}
                {activity.type === "follow" && <UserPlus className="h-4 w-4" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {activity.type === "post" && "Создал пост"}
                    {activity.type === "comment" && "Прокомментировал"}
                    {activity.type === "like" && "Лайкнул"}
                    {activity.type === "follow" && `Подписался на @${activity.target_username}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: ru
                    })}
                  </span>
                </div>

                {activity.type === "post" && (
                  <Link
                    href={`/post/${activity.post_id}`}
                    className="block hover:underline"
                  >
                    <p className="font-medium line-clamp-1">{activity.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {activity.content?.substring(0, 150)}...
                    </p>
                  </Link>
                )}

                {activity.type === "comment" && (
                  <Link
                    href={`/post/${activity.post_id}`}
                    className="block hover:underline"
                  >
                    <p className="text-sm text-muted-foreground">
                      в посте "{activity.title}"
                    </p>
                    <p className="text-sm line-clamp-2">
                      {activity.content}
                    </p>
                  </Link>
                )}

                {activity.type === "follow" && (
                  <Link
                    href={`/profile/${activity.target_username}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Посмотреть профиль
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
