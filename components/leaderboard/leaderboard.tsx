import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Trophy, TrendingUp, Award, MessageSquare } from "lucide-react"

export async function Leaderboard() {
  const supabase = await createClient()

  // Top users by reputation
  const { data: topReputation } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, reputation")
    .order("reputation", { ascending: false })
    .limit(10)

  // Get post counts for top contributors
  const topUserIds = topReputation?.map(u => u.id) || []
  const { data: postCounts } = await supabase
    .from("posts")
    .select("author_id")
    .in("author_id", topUserIds)

  const postCountMap = postCounts?.reduce((acc: Record<string, number>, post) => {
    acc[post.author_id] = (acc[post.author_id] || 0) + 1
    return acc
  }, {}) || {}

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Таблица лидеров
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topReputation && topReputation.length > 0 ? (
            topReputation.map((user, index) => {
              const postCount = postCountMap[user.id] || 0
              
              return (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors group"
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                    {index < 3 ? (
                      <Trophy className={`h-5 w-5 ${
                        index === 0 ? "text-yellow-500" : 
                        index === 1 ? "text-gray-400" : 
                        "text-amber-700"
                      }`} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-primary/10">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.display_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold group-hover:underline truncate">
                      {user.display_name || user.username}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="font-bold text-lg">
                        {user.reputation.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span>{postCount} постов</span>
                    </div>
                  </div>
                </Link>
              )
            })
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Нет данных для отображения
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export async function TrendingUsers() {
  const supabase = await createClient()
  
  // Get users who posted most in the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentPosts } = await supabase
    .from("posts")
    .select("author_id, profiles!inner(id, username, display_name, avatar_url)")
    .gte("created_at", sevenDaysAgo.toISOString())

  // Count posts per user
  const userCounts = recentPosts?.reduce((acc: Record<string, { count: number; user: any }>, post) => {
    const profile = (post.profiles as any)
    if (!acc[post.author_id]) {
      acc[post.author_id] = { count: 0, user: profile }
    }
    acc[post.author_id].count++
    return acc
  }, {}) || {}

  const trendingUsers = Object.values(userCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          Тренды недели
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trendingUsers.length > 0 ? (
            trendingUsers.map(({ user, count }) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors group"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>
                    {user.display_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium group-hover:underline truncate">
                    {user.display_name || user.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {count} постов на этой неделе
                  </p>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Нет активности на этой неделе
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
