import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  TrendingUp, 
  MessageSquare, 
  Eye, 
  ThumbsUp,
  FileText,
  Calendar,
  Award
} from "lucide-react"

interface UserStatisticsProps {
  userId: string
}

export async function UserStatistics({ userId }: UserStatisticsProps) {
  const supabase = await createClient()

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at, reputation")
    .eq("id", userId)
    .single()

  // Get post statistics
  const { data: posts } = await supabase
    .from("posts")
    .select("views, likes")
    .eq("author_id", userId)

  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", userId)

  const { count: commentCount } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("author_id", userId)

  // Calculate total views and likes
  const totalViews = posts?.reduce((sum, post) => sum + post.views, 0) || 0
  const totalLikes = posts?.reduce((sum, post) => sum + post.likes, 0) || 0

  // Calculate account age
  const accountAge = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Calculate average engagement
  const avgViewsPerPost = postCount ? Math.round(totalViews / postCount) : 0
  const avgLikesPerPost = postCount ? Math.round(totalLikes / postCount) : 0

  const stats = [
    {
      title: "Репутация",
      value: profile?.reputation?.toLocaleString() || "0",
      icon: Award,
      color: "text-yellow-500"
    },
    {
      title: "Всего просмотров",
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: "text-blue-500"
    },
    {
      title: "Всего лайков",
      value: totalLikes.toLocaleString(),
      icon: ThumbsUp,
      color: "text-green-500"
    },
    {
      title: "Постов",
      value: postCount?.toLocaleString() || "0",
      icon: FileText,
      color: "text-purple-500"
    },
    {
      title: "Комментариев",
      value: commentCount?.toLocaleString() || "0",
      icon: MessageSquare,
      color: "text-pink-500"
    },
    {
      title: "Средний просмотры",
      value: avgViewsPerPost.toLocaleString(),
      icon: TrendingUp,
      color: "text-orange-500"
    }
  ]

  return (
    <div className="space-y-6">
      <Card className="dark:bg-[#181818]">
        <CardHeader>
          <CardTitle>Статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.title} className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <p className="text-sm">{stat.title}</p>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-[#181818]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Информация об аккаунте
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Возраст аккаунта</span>
            <span className="font-medium">{accountAge} дней</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Средний лайки/пост</span>
            <span className="font-medium">{avgLikesPerPost}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Всего активностей</span>
            <span className="font-medium">{(postCount || 0) + (commentCount || 0)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
