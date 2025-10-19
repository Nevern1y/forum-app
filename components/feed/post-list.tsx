import { createClient } from "@/lib/supabase/server"
import { PostCard } from "@/components/feed/post-card"
import type { Post } from "@/lib/types"
import { ErrorBoundary } from "react-error-boundary"

interface PostListProps {
  sortBy: string
}

export async function PostList({ sortBy }: PostListProps) {
  const supabase = await createClient()

  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser()

  // Use the optimized RPC function
  const { data: posts, error } = await supabase.rpc('get_posts_with_counts', {
    sort_by: sortBy,
    limit_count: 20,
    user_id: user?.id || null
  })

  if (error) {
    console.error('Error fetching posts:', error)
    return (
      <div className="text-center py-16">
        <p className="text-[15px] text-muted-foreground">Ошибка загрузки постов</p>
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[15px] text-muted-foreground">Пока нет постов. Создайте первый!</p>
      </div>
    )
  }

  // Transform the data to match the Post interface
  const postsWithUserData: Post[] = posts.map((post: any) => {
    // Parse tags if it's a string, otherwise use as-is
    let parsedTags: any[] = []
    if (post.tags) {
      try {
        parsedTags = typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags
      } catch (e) {
        console.error('Error parsing tags:', e)
        parsedTags = []
      }
    }

    // Parse media_urls if needed
    let parsedMediaUrls: string[] | null = null
    if (post.media_urls) {
      try {
        parsedMediaUrls = Array.isArray(post.media_urls)
          ? post.media_urls
          : JSON.parse(post.media_urls)
      } catch (e) {
        console.error('Error parsing media_urls:', e)
        parsedMediaUrls = null
      }
    }

    // Parse author JSON safely
    let authorData = null
    if (post.author) {
      try {
        authorData = typeof post.author === 'string' ? JSON.parse(post.author) : post.author
      } catch (e) {
        console.error('Error parsing author:', e)
        authorData = null
      }
    }

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      author_id: post.author_id,
      views: post.views || 0,
      likes: post.likes || 0,
      dislikes: post.dislikes || 0,
      comment_count: post.comment_count || 0,
      is_pinned: post.is_pinned || false,
      media_urls: parsedMediaUrls,
      audio_url: post.audio_url,
      created_at: post.created_at,
      updated_at: post.updated_at,
      profiles: authorData ? {
        id: post.author_id,
        username: authorData.username,
        display_name: authorData.display_name,
        avatar_url: authorData.avatar_url,
        reputation: authorData.reputation,
        created_at: '',
        updated_at: ''
      } : null,
      post_tags: Array.isArray(parsedTags) ? parsedTags.map((tag: any) => ({ tags: tag })) : [],
      user_reaction: post.user_reaction || null
    }
  })

  return (
    <ErrorBoundary
      fallback={
        <div className="text-center py-16">
          <p className="text-[15px] text-muted-foreground">Ошибка загрузки постов</p>
        </div>
      }
    >
      <div className="divide-y divide-border">
        {postsWithUserData.map((post: Post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </ErrorBoundary>
  )
}
