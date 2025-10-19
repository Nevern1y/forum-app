import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { PostActions } from "@/components/post/post-actions"
import { CommentSection } from "@/components/post/comment-section"
import { MarkdownViewer } from "@/components/ui/markdown-viewer"
import { Clock } from "lucide-react"
import { calculateReadingTime, formatReadingTime } from "@/lib/utils/reading-time"
import { PostMenu } from "@/components/post/post-menu"
import { MediaGallery } from "@/components/media/media-gallery"
import { AudioPlayer } from "@/components/media/audio-player"

// Кеширование страницы на 60 секунд для ускорения загрузки
export const revalidate = 60

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Выполняем все запросы параллельно для ускорения загрузки
  const [
    { data: post, error },
    { data: reactions },
    { data: userReaction },
    { data: bookmark },
  ] = await Promise.all([
    // Get post data
    supabase
      .from("posts")
      .select(`
        *,
        profiles:author_id (username, display_name, avatar_url, reputation),
        post_tags (
          tags (name)
        )
      `)
      .eq("id", id)
      .single(),
    // Get reaction counts
    supabase
      .from("post_reactions")
      .select("reaction_type")
      .eq("post_id", id),
    // Check user's reaction
    supabase
      .from("post_reactions")
      .select("reaction_type")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .single(),
    // Check if bookmarked
    supabase
      .from("bookmarks")
      .select("*")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .single(),
  ])

  if (error || !post) {
    notFound()
  }

  // Calculate likes and dislikes from reactions
  const likes = reactions?.filter((r) => r.reaction_type === "like").length || 0
  const dislikes = reactions?.filter((r) => r.reaction_type === "dislike").length || 0

  // Increment view count (fire and forget с защитой от накрутки)
  supabase.rpc("increment_post_views", { post_id: id }).then(({ data, error }) => {
    if (error) {
      // Полное логирование ошибки для диагностики
      console.error("[Post Views] ❌ FAILED - Full error object:", error)
      console.error("[Post Views] ❌ Error stringified:", JSON.stringify(error, null, 2))
      console.error("[Post Views] ❌ Error keys:", Object.keys(error))
      console.error("[Post Views] ❌ Error values:", Object.values(error))
      
      // Проверяем все возможные поля
      const err = error as any
      console.error("[Post Views] ❌ Parsed fields:", {
        message: err.message || err.msg || 'No message',
        details: err.details || err.detail || 'No details',
        hint: err.hint || 'No hint',
        code: err.code || err.error_code || 'No code',
        status: err.status || err.statusCode || 'No status',
        statusText: err.statusText || 'No status text'
      })
    } else if (data) {
      // Функция возвращает JSON с информацией о просмотре
      if (data.incremented) {
        console.log(`[Post Views] ✅ Incremented to ${data.views}`)
      } else {
        console.log(`[Post Views] 🕐 Cooldown (${data.cooldown_minutes}min), current: ${data.views}`)
      }
    } else {
      console.warn("[Post Views] ⚠️ No data returned from function")
    }
  })

  const profile = post.profiles
  const tags = post.post_tags?.map((pt: { tags: { name: string } | null }) => pt.tags?.name).filter(Boolean) || []
  const readingTime = calculateReadingTime(post.content)

  return (
    <div className="container mx-auto max-w-4xl px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 mb-16 md:mb-0">
      <Card className="dark:bg-[#181818] border-0 sm:border">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <Link href={`/profile/${profile?.username}`} className="shrink-0">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-border">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-sm sm:text-base">
                  {profile?.display_name?.[0]?.toUpperCase() || profile?.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Link href={`/profile/${profile?.username}`} className="font-medium hover:underline truncate max-w-[120px] sm:max-w-none">
                    {profile?.display_name || profile?.username}
                  </Link>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">{profile?.reputation} репутации</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-[11px] sm:text-sm">
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatReadingTime(readingTime)}
                  </span>
                </div>
                <PostMenu 
                  postId={post.id} 
                  authorId={post.author_id}
                  currentUserId={user.id}
                  postTitle={post.title}
                />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words leading-tight">{post.title}</h1>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs sm:text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
          <MarkdownViewer content={post.content} />

          {/* Media Gallery - Full size */}
          {post.media_urls && post.media_urls.length > 0 && (
            <MediaGallery images={post.media_urls} />
          )}

          {/* Audio Player */}
          {post.audio_url && (
            <AudioPlayer url={post.audio_url} />
          )}

          <PostActions
            postId={post.id}
            postTitle={post.title}
            likes={likes}
            dislikes={dislikes}
            views={post.views || 0}
            userReaction={userReaction?.reaction_type || null}
            isBookmarked={!!bookmark}
          />
        </CardContent>
      </Card>

      <div className="mt-6 sm:mt-8">
        <CommentSection postId={post.id} />
      </div>
    </div>
  )
}
