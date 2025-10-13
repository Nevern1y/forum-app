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

  // Параллельно загружаем данные о реакциях (лайки/дизлайки) и комментариях для всех постов
  const postIds = posts.map(p => p.id)
  
  const [
    { data: userReactions },
    { data: allReactions },
    { data: commentCounts }
  ] = await Promise.all([
    // Получаем реакцию пользователя для всех постов одним запросом
    user ? supabase
      .from("post_reactions")
      .select("post_id, reaction_type")
      .eq("user_id", user.id)
      .in("post_id", postIds)
      .in("reaction_type", ["like", "dislike"]) : Promise.resolve({ data: [] }),
    // Получаем все лайки/дизлайки для подсчёта
    supabase
      .from("post_reactions")
      .select("post_id, reaction_type")
      .in("post_id", postIds)
      .in("reaction_type", ["like", "dislike"]),
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

  // Создаём словарь реакций пользователя (like/dislike/null)
  const userReactionsMap = new Map(
    userReactions?.map(r => [r.post_id, r.reaction_type]) || []
  )

  // Подсчитываем лайки и дизлайки для каждого поста
  const reactionsCount = allReactions?.reduce((acc, reaction) => {
    if (!acc[reaction.post_id]) {
      acc[reaction.post_id] = { likes: 0, dislikes: 0 }
    }
    if (reaction.reaction_type === 'like') {
      acc[reaction.post_id].likes++
    } else if (reaction.reaction_type === 'dislike') {
      acc[reaction.post_id].dislikes++
    }
    return acc
  }, {} as Record<string, { likes: number; dislikes: number }>) || {}

  // Добавляем данные к постам
  const postsWithUserData = posts.map(post => ({
    ...post,
    user_reaction: userReactionsMap.get(post.id) || null,
    likes: reactionsCount[post.id]?.likes || 0,
    dislikes: reactionsCount[post.id]?.dislikes || 0,
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
