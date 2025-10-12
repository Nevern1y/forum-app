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

  // Increment view count
  await supabase.rpc("increment_post_views", { post_id: id })

  // Get post data
  const { data: post, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:author_id (username, display_name, avatar_url, reputation),
      post_tags (
        tags (name)
      )
    `)
    .eq("id", id)
    .single()

  if (error || !post) {
    notFound()
  }

  // Check user's reaction
  const { data: userReaction } = await supabase
    .from("post_reactions")
    .select("reaction_type")
    .eq("post_id", id)
    .eq("user_id", user.id)
    .single()

  // Check if bookmarked
  const { data: bookmark } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("post_id", id)
    .eq("user_id", user.id)
    .single()

  const profile = post.profiles
  const tags = post.post_tags.map((pt) => pt.tags?.name).filter(Boolean)
  const readingTime = calculateReadingTime(post.content)

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <Card className="dark:bg-[#181818]">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Link href={`/profile/${profile?.username}`}>
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {profile?.display_name?.[0]?.toUpperCase() || profile?.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Link href={`/profile/${profile?.username}`} className="font-medium hover:underline">
                    {profile?.display_name || profile?.username}
                  </Link>
                <span>•</span>
                <span>{profile?.reputation} репутации</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
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
              <h1 className="text-2xl sm:text-3xl font-bold break-words">{post.title}</h1>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
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
            likes={post.likes}
            dislikes={post.dislikes}
            views={post.views}
            userReaction={userReaction?.reaction_type || null}
            isBookmarked={!!bookmark}
          />
        </CardContent>
      </Card>

      <div className="mt-8">
        <CommentSection postId={post.id} />
      </div>
    </div>
  )
}
