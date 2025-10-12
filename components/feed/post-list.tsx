import { createClient } from "@/lib/supabase/server"
import { PostCard } from "@/components/feed/post-card"

interface PostListProps {
  sortBy: string
}

export async function PostList({ sortBy }: PostListProps) {
  const supabase = await createClient()
  
  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser()

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

  // Параллельно загружаем данные о лайках и комментариях для всех постов
  const postIds = posts.map(p => p.id)
  
  const [
    { data: userReactions },
    { data: commentCounts }
  ] = await Promise.all([
    // Получаем лайки пользователя для всех постов одним запросом
    user ? supabase
      .from("post_reactions")
      .select("post_id, reaction_type")
      .eq("user_id", user.id)
      .in("post_id", postIds) : Promise.resolve({ data: [] }),
    // Получаем количество комментариев для всех постов одним запросом
    supabase
      .from("comments")
      .select("post_id")
      .in("post_id", postIds)
      .then(({ data }) => {
        const counts = data?.reduce((acc, comment) => {
          acc[comment.post_id] = (acc[comment.post_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        return { data: counts }
      })
  ])

  // Создаём словари для быстрого доступа
  const reactionsMap = new Map(
    userReactions?.map(r => [r.post_id, r.reaction_type === 'like']) || []
  )

  // Добавляем данные к постам
  const postsWithUserData = posts.map(post => ({
    ...post,
    user_has_liked: reactionsMap.get(post.id) || false,
    comment_count: commentCounts?.[post.id] || 0
  }))

  return (
    <div className="divide-y divide-border">
      {postsWithUserData.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
