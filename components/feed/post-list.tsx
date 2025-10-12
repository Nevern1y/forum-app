import { createClient } from "@/lib/supabase/server"
import { PostCard } from "@/components/feed/post-card"

interface PostListProps {
  sortBy: string
}

export async function PostList({ sortBy }: PostListProps) {
  const supabase = await createClient()

  let query = supabase.from("posts").select(`
      *,
      profiles:author_id (username, display_name, avatar_url, reputation),
      post_tags (
        tags (name)
      )
    `)

  // Apply sorting
  if (sortBy === "popular") {
    query = query.order("likes", { ascending: false })
  } else if (sortBy === "discussed") {
    // For discussed, we'll order by a combination of views and comments
    // Since we can't easily count comments in a single query, we'll use views as proxy
    query = query.order("views", { ascending: false })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const { data: posts } = await query.limit(20)

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[15px] text-muted-foreground">Пока нет постов. Создайте первый!</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
