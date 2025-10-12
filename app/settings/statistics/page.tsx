import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Users, Heart, MessageSquare, TrendingUp } from "lucide-react"

export default async function StatisticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", user.id)

  if ((followersCount || 0) < 50) {
    redirect("/feed")
  }

  const { count: postsCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", user.id)

  const { count: commentsCount } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("author_id", user.id)

  const { data: posts } = await supabase
    .from("posts")
    .select("id, post_votes(vote_type)")
    .eq("author_id", user.id)

  const totalLikes = posts?.reduce((sum, post) => {
    const likes = post.post_votes?.filter((v: any) => v.vote_type === 1).length || 0
    return sum + likes
  }, 0) || 0

  const { data: profile } = await supabase
    .from("profiles")
    .select("reputation")
    .eq("id", user.id)
    .single()

  const stats = [
    {
      label: "Подписчики",
      value: followersCount || 0,
      icon: Users,
      description: "Пользователи, которые на вас подписаны",
    },
    {
      label: "Посты",
      value: postsCount || 0,
      icon: MessageSquare,
      description: "Всего опубликовано постов",
    },
    {
      label: "Комментарии",
      value: commentsCount || 0,
      icon: BarChart3,
      description: "Всего оставлено комментариев",
    },
    {
      label: "Лайки",
      value: totalLikes,
      icon: Heart,
      description: "Получено лайков на ваших постах",
    },
    {
      label: "Репутация",
      value: profile?.reputation || 0,
      icon: TrendingUp,
      description: "Ваш уровень репутации",
    },
  ]

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Статистика</h1>
          <p className="text-muted-foreground mt-2">
            Подробная статистика вашей активности
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
