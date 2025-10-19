import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PostCard } from "@/components/feed/post-card"
import { Bookmark, Sparkles, Clock } from "lucide-react"

export default async function BookmarksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Получаем ID постов из закладок пользователя
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("post_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const bookmarkedPostIds = bookmarks?.map((b) => b.post_id) || []

  // Если нет закладок, показываем пустое состояние
  if (bookmarkedPostIds.length === 0) {
    return (
      <div className="min-h-screen bg-muted/30 dark:bg-background">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border/40">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-2">
              <Bookmark className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Закладки</h1>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-background dark:bg-[#181818] border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="text-center py-20 px-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 animate-in fade-in zoom-in duration-300">
                <Bookmark className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Нет сохранённых постов</h2>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Сохраняйте интересные посты в закладки, чтобы легко находить их позже
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Быстрый доступ</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Читайте потом</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Получаем полные данные постов с использованием RPC функции
  const { data: posts, error } = await supabase.rpc("get_posts_with_counts")

  if (error) {
    console.error("[Bookmarks] Error fetching posts:", error)
  }

  // Фильтруем только закладки и сохраняем порядок сортировки
  const bookmarkedPosts = bookmarkedPostIds
    .map(postId => posts?.find((post: any) => post.id === postId))
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Закладки</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              {bookmarkedPosts.length} {bookmarkedPosts.length === 1 ? 'пост' : 'постов'}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-background dark:bg-[#181818] border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {bookmarkedPosts.length > 0 ? (
            <div className="divide-y divide-border">
              {bookmarkedPosts.map((post: any, index: number) => (
                <div
                  key={post.id}
                  className="animate-in fade-in slide-in-from-bottom-2"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Не удалось загрузить сохранённые посты
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
