import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PostList } from "@/components/feed/post-list"
import { QuickPostCreate } from "@/components/post/quick-post-create"

// Кеширование ленты на 30 секунд для быстрой загрузки
export const revalidate = 30

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const sortBy = params.sort || "new"

  // Get user profile for quick post create
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 via-muted/10 to-background dark:bg-background">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-center">
          <h1 className="text-xl font-bold tracking-tight">Для вас</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-card/80 dark:bg-[#181818] backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg overflow-hidden">
          <QuickPostCreate 
            userAvatar={profile?.avatar_url}
            username={profile?.username}
            displayName={profile?.display_name}
          />
          <PostList sortBy={sortBy} />
        </div>
      </div>
    </div>
  )
}
