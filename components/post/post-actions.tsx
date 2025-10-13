"use client"

import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, Eye, Bookmark } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EmojiPicker, EmojiReactionsDisplay } from "@/components/reactions/emoji-picker"
import { SharePostButton } from "@/components/post/share-post-button"

interface PostActionsProps {
  postId: string
  postTitle: string
  likes: number
  dislikes: number
  views: number
  userReaction: string | null
  isBookmarked: boolean
}

export function PostActions({
  postId,
  postTitle,
  likes,
  dislikes,
  views,
  userReaction: initialReaction,
  isBookmarked: initialBookmarked,
}: PostActionsProps) {
  const [userReaction, setUserReaction] = useState<string | null>(initialReaction)
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const [localLikes, setLocalLikes] = useState(likes)
  const [localDislikes, setLocalDislikes] = useState(dislikes)
  const [isLoading, setIsLoading] = useState(false)
  const [emojiReactions, setEmojiReactions] = useState<Record<string, { count: number; userReacted: boolean }>>({})
  const router = useRouter()

  useEffect(() => {
    loadEmojiReactions()
  }, [postId])

  const loadEmojiReactions = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get all emoji reactions for this post
    const { data: reactions } = await supabase
      .from("post_reactions")
      .select("reaction_type, user_id")
      .eq("post_id", postId)
      .not("reaction_type", "in", '("like","dislike")')
    
    if (reactions) {
      const grouped = reactions.reduce((acc: Record<string, { count: number; userReacted: boolean }>, r) => {
        if (!acc[r.reaction_type]) {
          acc[r.reaction_type] = { count: 0, userReacted: false }
        }
        acc[r.reaction_type].count++
        if (user && r.user_id === user.id) {
          acc[r.reaction_type].userReacted = true
        }
        return acc
      }, {})
      
      setEmojiReactions(grouped)
    }
  }

  const handleReaction = async (reactionType: "like" | "dislike") => {
    if (isLoading) return
    
    setIsLoading(true)
    
    // Сохраняем текущее состояние
    const previousReaction = userReaction
    const previousLikes = localLikes
    const previousDislikes = localDislikes

    // МГНОВЕННОЕ оптимистичное обновление UI
    if (previousReaction === reactionType) {
      // Убираем реакцию
      setUserReaction(null)
      if (reactionType === "like") {
        setLocalLikes((prev) => Math.max(0, prev - 1))
      } else {
        setLocalDislikes((prev) => Math.max(0, prev - 1))
      }
    } else {
      // Меняем или добавляем реакцию
      if (previousReaction === "like") {
        setLocalLikes((prev) => Math.max(0, prev - 1))
        setLocalDislikes((prev) => prev + 1)
      } else if (previousReaction === "dislike") {
        setLocalDislikes((prev) => Math.max(0, prev - 1))
        setLocalLikes((prev) => prev + 1)
      } else {
        // Новая реакция (не было реакции)
        if (reactionType === "like") {
          setLocalLikes((prev) => prev + 1)
        } else {
          setLocalDislikes((prev) => prev + 1)
        }
      }
      setUserReaction(reactionType)
    }

    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Откатываем изменения
        setUserReaction(previousReaction)
        setLocalLikes(previousLikes)
        setLocalDislikes(previousDislikes)
        toast.error('Войдите, чтобы реагировать на посты')
        setIsLoading(false)
        return
      }

      if (previousReaction === reactionType) {
        // Удаляем реакцию
        await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .eq("reaction_type", reactionType)
      } else {
        // Удаляем старую реакцию (если была) и добавляем новую
        if (previousReaction) {
          await supabase
            .from("post_reactions")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", user.id)
        }
        
        await supabase
          .from("post_reactions")
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType,
          })
      }

      router.refresh()
      setIsLoading(false)
    } catch (error) {
      console.error("Error handling reaction:", error)
      
      // Откатываем изменения при ошибке
      setUserReaction(previousReaction)
      setLocalLikes(previousLikes)
      setLocalDislikes(previousDislikes)
      toast.error('Ошибка при обновлении реакции')
      setIsLoading(false)
    }
  }

  const handleBookmark = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      if (isBookmarked) {
        await supabase.from("bookmarks").delete().eq("post_id", postId).eq("user_id", user.id)
        setIsBookmarked(false)
        toast.success("Удалено из закладок")
      } else {
        await supabase.from("bookmarks").insert({
          post_id: postId,
          user_id: user.id,
        })
        setIsBookmarked(true)
        toast.success("Добавлено в закладки")
      }

      router.refresh()
    } catch (error) {
      console.error("Error handling bookmark:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmojiReaction = async (reactionType: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const userReacted = emojiReactions[reactionType]?.userReacted

      if (userReacted) {
        // Remove reaction
        await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .eq("reaction_type", reactionType)
        
        setEmojiReactions(prev => ({
          ...prev,
          [reactionType]: {
            count: Math.max(0, (prev[reactionType]?.count || 1) - 1),
            userReacted: false
          }
        }))
      } else {
        // Add reaction
        await supabase
          .from("post_reactions")
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType
          })
        
        setEmojiReactions(prev => ({
          ...prev,
          [reactionType]: {
            count: (prev[reactionType]?.count || 0) + 1,
            userReacted: true
          }
        }))
      }
      
      router.refresh()
    } catch (error) {
      console.error("Error handling emoji reaction:", error)
    }
  }

  const currentEmojiReaction = Object.entries(emojiReactions).find(
    ([_, data]) => data.userReacted
  )?.[0]

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <Button
          variant={userReaction === "like" ? "default" : "outline"}
          size="sm"
          onClick={() => handleReaction("like")}
          disabled={isLoading}
          className={`transition-all ${userReaction === "like" ? "bg-primary text-primary-foreground" : ""}`}
        >
          <ThumbsUp className="h-4 w-4 mr-1.5" />
          <span className="font-medium">{localLikes}</span>
        </Button>
        <Button
          variant={userReaction === "dislike" ? "destructive" : "outline"}
          size="sm"
          onClick={() => handleReaction("dislike")}
          disabled={isLoading}
          className={`transition-all ${userReaction === "dislike" ? "bg-destructive text-destructive-foreground" : ""}`}
        >
          <ThumbsDown className="h-4 w-4 mr-1.5" />
          <span className="font-medium">{localDislikes}</span>
        </Button>
        </div>

        <EmojiPicker 
          onSelect={handleEmojiReaction} 
          currentReaction={currentEmojiReaction}
        />
      
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span className="font-medium">{views.toLocaleString()}</span>
          <span className="hidden sm:inline">просмотров</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <SharePostButton postId={postId} postTitle={postTitle} />
          
          <Button
            variant={isBookmarked ? "default" : "outline"}
            size="sm"
            onClick={handleBookmark}
            disabled={isLoading}
            className="gap-1.5 transition-all"
          >
            <Bookmark className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} />
            <span className="hidden sm:inline">{isBookmarked ? "Сохранено" : "Сохранить"}</span>
          </Button>
        </div>
      </div>

      <EmojiReactionsDisplay 
        reactions={emojiReactions}
        onReactionClick={handleEmojiReaction}
      />
    </div>
  )
}
