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

  const { data: likedPosts } = await supabase
    .from("post_votes")
    .select(`
      post_id,
      posts (
        *,
        profiles!posts_author_id_fkey (
          username,
          display_name,
          avatar_url
        ),
        post_votes (
          user_id,
          vote_type
        ),
        post_media (
          id,
          media_url,
          media_type
        ),
        bookmarks (
          user_id
        )
      )
    `)
    .eq("user_id", user.id)
    .eq("vote_type", 1)
    .order("created_at", { ascending: false })

  const posts = likedPosts?.map((item) => item.posts).filter(Boolean) || []

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-center">Понравившееся</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-background dark:bg-[#181818] border border-border rounded-lg shadow-sm overflow-hidden">
          {posts.length > 0 ? (
            <div className="divide-y divide-border">
              {posts.map((post: any) => (
                <PostCard
                  key={post.id}
                  post={post}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Вы еще не поставили лайки ни одному посту</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
