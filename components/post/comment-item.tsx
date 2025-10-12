"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { CommentForm } from "@/components/post/comment-form"
import { useRouter } from "next/navigation"
import { MediaGallery } from "@/components/media/media-gallery"
import { AudioPlayerCompact } from "@/components/media/audio-player-compact"

interface Comment {
  id: string
  content: string
  likes: number
  dislikes: number
  created_at: string
  author_id: string
  parent_id: string | null
  media_urls?: string[] | null
  audio_url?: string | null
  profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
    reputation: number
  } | null
}

interface CommentItemProps {
  comment: Comment
  postId: string
  depth?: number
}

export function CommentItem({ comment, postId, depth = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replies, setReplies] = useState<Comment[]>([])
  const [showReplies, setShowReplies] = useState(false)
  const [replyCount, setReplyCount] = useState(0)
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [localLikes, setLocalLikes] = useState(comment.likes)
  const [localDislikes, setLocalDislikes] = useState(comment.dislikes)
  const router = useRouter()

  const profile = comment.profiles

  useEffect(() => {
    const loadReplies = async () => {
      const supabase = createClient()

      // Get reply count
      const { count } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("parent_id", comment.id)

      setReplyCount(count || 0)

      // Load replies if showing
      if (showReplies) {
        const { data } = await supabase
          .from("comments")
          .select(`
            *,
            profiles:author_id (username, display_name, avatar_url, reputation),
            media_urls,
            audio_url
          `)
          .eq("parent_id", comment.id)
          .order("created_at", { ascending: true })

        if (data) setReplies(data)
      }
    }

    loadReplies()
  }, [comment.id, showReplies])

  useEffect(() => {
    const loadUserReaction = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("comment_reactions")
        .select("reaction_type")
        .eq("comment_id", comment.id)
        .eq("user_id", user.id)
        .single()

      if (data) setUserReaction(data.reaction_type)
    }

    loadUserReaction()
  }, [comment.id])

  const handleReaction = async (reactionType: "like" | "dislike") => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    try {
      if (userReaction === reactionType) {
        // Remove reaction
        await supabase.from("comment_reactions").delete().eq("comment_id", comment.id).eq("user_id", user.id)

        setUserReaction(null)
        if (reactionType === "like") {
          setLocalLikes((prev) => prev - 1)
        } else {
          setLocalDislikes((prev) => prev - 1)
        }
      } else {
        // Add or update reaction
        if (userReaction) {
          // Update existing reaction
          await supabase
            .from("comment_reactions")
            .update({ reaction_type: reactionType })
            .eq("comment_id", comment.id)
            .eq("user_id", user.id)

          // Adjust counts
          if (userReaction === "like") {
            setLocalLikes((prev) => prev - 1)
            setLocalDislikes((prev) => prev + 1)
          } else {
            setLocalDislikes((prev) => prev - 1)
            setLocalLikes((prev) => prev + 1)
          }
        } else {
          // Insert new reaction
          await supabase.from("comment_reactions").insert({
            comment_id: comment.id,
            user_id: user.id,
            reaction_type: reactionType,
          })

          if (reactionType === "like") {
            setLocalLikes((prev) => prev + 1)
          } else {
            setLocalDislikes((prev) => prev + 1)
          }
        }
        setUserReaction(reactionType)
      }

      router.refresh()
    } catch (error) {
      console.error("[v0] Error handling reaction:", error)
    }
  }

  const maxDepth = 3

  return (
    <div className={depth > 0 ? "ml-4 sm:ml-8 border-l-2 border-primary/20 pl-4" : ""}>
      <Card className="transition-all hover:shadow-md dark:bg-[#181818]">
        <CardContent className="pt-4">
          <div className="flex gap-3 sm:gap-4">
            <Link href={`/profile/${profile?.username}`} className="shrink-0">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-background hover:ring-primary/50 transition-all">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {profile?.display_name?.[0]?.toUpperCase() || profile?.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <Link href={`/profile/${profile?.username}`} className="font-medium hover:underline">
                  {profile?.display_name || profile?.username}
                </Link>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{profile?.reputation} реп.</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
              
              {/* Media Gallery for comments */}
              {comment.media_urls && comment.media_urls.length > 0 && (
                <div className="mt-2">
                  <MediaGallery 
                    images={comment.media_urls} 
                    compact 
                    disableHover={false}
                    contentSize="small"
                  />
                </div>
              )}

              {/* Audio Player for comments */}
              {comment.audio_url && (
                <div className="mt-2">
                  <AudioPlayerCompact url={comment.audio_url} />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction("like")}
                  className={`h-8 px-2 sm:px-3 transition-colors ${userReaction === "like" ? "text-primary bg-primary/10" : ""}`}
                >
                  <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-xs">{localLikes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction("dislike")}
                  className={`h-8 px-2 sm:px-3 transition-colors ${userReaction === "dislike" ? "text-destructive bg-destructive/10" : ""}`}
                >
                  <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-xs">{localDislikes}</span>
                </Button>
                {depth < maxDepth && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="h-8 px-2 sm:px-3"
                  >
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="text-xs">Ответить</span>
                  </Button>
                )}
                {replyCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowReplies(!showReplies)}
                    className="h-8 px-2 sm:px-3"
                  >
                    <span className="text-xs">
                      {showReplies ? "Скрыть" : "Показать"} ({replyCount})
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {showReplyForm && (
            <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onCancel={() => setShowReplyForm(false)}
                onSuccess={() => {
                  setShowReplyForm(false)
                  setShowReplies(true)
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {showReplies && replies.length > 0 && (
        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} postId={postId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
