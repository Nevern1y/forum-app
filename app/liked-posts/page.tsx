import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PostCard } from "@/components/feed/post-card"

export default async function LikedPostsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Получаем ID постов с лайками пользователя
  const { data: likedReactions } = await supabase
    .from("post_reactions")
    .select("post_id")
    .eq("user_id", user.id)
    .eq("reaction_type", "like")
    .order("created_at", { ascending: false })

  const likedPostIds = likedReactions?.map((r) => r.post_id) || []

  // Если нет лайкнутых постов, возвращаем пустой массив
  if (likedPostIds.length === 0) {
    return (
      <div className="min-h-screen bg-muted/30 dark:bg-background">
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-center">Понравившееся</h1>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-background dark:bg-[#181818] border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Вы еще не поставили лайки ни одному посту</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Получаем полные данные постов с использованием функции
  const { data: posts, error } = await supabase.rpc("get_posts_with_counts", {
    p_user_id: user.id,
  })

  if (error) {
    console.error("[Liked Posts] Error fetching posts:", error)
  }

  // Фильтруем только лайкнутые посты
  const likedPosts = posts?.filter((post: any) => likedPostIds.includes(post.id)) || []

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-center">Понравившееся</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-background dark:bg-[#181818] border border-border rounded-lg shadow-sm overflow-hidden">
          {likedPosts.length > 0 ? (
            <div className="divide-y divide-border">
              {likedPosts.map((post: any) => (
                <PostCard
                  key={post.id}
                  post={post}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Не удалось загрузить понравившиеся посты</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
