"use client"

import { useState, useEffect, memo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { MessageSquare, Eye, ThumbsUp, Pin, Share2 } from "lucide-react"
import { MediaGallery } from "@/components/media/media-gallery"
import { AudioPlayerCompact } from "@/components/media/audio-player-compact"
import { SharePostButton } from "@/components/post/share-post-button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useReactionsRealtime } from "@/hooks/use-reactions-realtime"

interface PostCardProps {
  post: {
    id: string
    title: string
    content: string
    views: number
    likes: number
    created_at: string
    is_pinned?: boolean
    media_urls?: string[] | null
    audio_url?: string | null
    comment_count?: number
    user_has_liked?: boolean
    profiles: {
      username: string
      display_name: string | null
      avatar_url: string | null
      reputation: number
    } | null
    post_tags: Array<{
      tags: {
        name: string
      } | null
    }>
  }
}

// Remove markdown formatting for plain text preview
const stripMarkdown = (text: string): string => {
  return text
    // Remove headers
    .replace(/#{1,6}\s/g, '')
    // Remove bold/italic
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove links [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove blockquotes
    .replace(/^\s*>\s/gm, '')
    // Remove lists
    .replace(/^\s*[-*+]\s/gm, '')
    .replace(/^\s*\d+\.\s/gm, '')
    // Remove horizontal rules
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    // Remove images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const PostCardComponent = ({ post }: PostCardProps) => {
  const profile = post.profiles
  const tags = post.post_tags.map((pt) => pt.tags?.name).filter(Boolean)
  
  const [isLiked, setIsLiked] = useState(post.user_has_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes)
  const [isLiking, setIsLiking] = useState(false)
  const [lastLikeTime, setLastLikeTime] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Получаем ID текущего пользователя
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null)
    })
  }, [])

  // Realtime подписка на реакции - ОПТИМИЗИРОВАНО!
  useReactionsRealtime({
    postId: post.id,
    onNewReaction: (reaction) => {
      // Увеличиваем счетчик (мгновенно, без запроса к БД!)
      setLikesCount(prev => prev + 1)
      
      // Если это наш лайк - обновляем статус
      if (reaction.user_id === currentUserId) {
        setIsLiked(true)
      }
    },
    onDeleteReaction: (reactionId) => {
      // Уменьшаем счетчик (мгновенно!)
      setLikesCount(prev => Math.max(0, prev - 1))
    },
  })

  // Синхронизируем состояние ТОЛЬКО при смене поста (не при каждом изменении likes!)
  // Это предотвращает рассинхронизацию между предпросмотром и полным постом
  useEffect(() => {
    setIsLiked(post.user_has_liked || false)
    setLikesCount(post.likes || 0)
  }, [post.id]) // Только при смене post.id, НЕ при изменении likes!
  
  // Display plain text (no markdown) content for preview
  const plainContent = post.content ? stripMarkdown(post.content) : ''
  const contentLength = plainContent.length
  const displayContent = contentLength <= 400 
    ? plainContent
    : plainContent.substring(0, 400) + '...'
  
  // Calculate content size based on text length for media adaptation
  const totalTextLength = (post.title?.length || 0) + contentLength
  const contentSize: 'small' | 'medium' | 'large' = 
    totalTextLength < 150 ? 'small' : 
    totalTextLength > 350 ? 'large' : 
    'medium'

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Rate limiting: max 1 action per 2 seconds
    const now = Date.now()
    if (now - lastLikeTime < 2000) {
      toast.warning('Подождите немного перед следующим действием')
      return
    }
    
    if (isLiking) return

    // Проверка на наличие post.id
    if (!post?.id) {
      console.error('Post ID is missing')
      toast.error('Ошибка: не удалось найти пост')
      return
    }
    
    setIsLiking(true)
    setLastLikeTime(now)
    
    // Optimistic update - обновляем только isLiked, счётчик обновится через realtime!
    const newIsLiked = !isLiked
    const previousIsLiked = isLiked
    setIsLiked(newIsLiked)
    
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Auth error:', authError)
        setIsLiked(previousIsLiked) // Revert
        toast.error('Ошибка авторизации')
        return
      }
      
      if (!user) {
        console.warn('User not authenticated')
        setIsLiked(previousIsLiked) // Revert
        toast.error('Войдите, чтобы лайкать посты')
        return
      }

      if (newIsLiked) {
        // First, try to delete any existing reaction (in case of old constraint)
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
        
        // Then insert the new like
        const { data, error } = await supabase
          .from('post_reactions')
          .insert({ 
            post_id: post.id, 
            user_id: user.id,
            reaction_type: 'like'
          })
          .select()
        
        if (error) {
          console.error('Insert error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          setIsLiked(previousIsLiked) // Revert
          toast.error('Ошибка при добавлении лайка')
          return
        }
        console.log('Like added:', data)
      } else {
        const { data, error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .eq('reaction_type', 'like')
          .select()
        
        if (error) {
          console.error('Delete error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          setIsLiked(previousIsLiked) // Revert
          toast.error('Ошибка при удалении лайка')
          return
        }
        console.log('Like removed:', data)
      }
    } catch (error: any) {
      console.error('Error toggling like:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      })
      // Revert on error
      setIsLiked(previousIsLiked)
      toast.error('Ошибка при обновлении лайка')
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <article className={`threads-post group relative ${post.is_pinned ? "bg-primary/5" : ""}`}>
      <div className="flex gap-3 px-5 py-4">
        <Link href={`/profile/${profile?.username}`} className="shrink-0 pt-0.5">
          <Avatar className="h-9 w-9 ring-1 ring-border">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
              {profile?.display_name?.[0]?.toUpperCase() || profile?.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[15px]">
              <Link 
                href={`/profile/${profile?.username}`} 
                className="font-semibold hover:underline text-foreground decoration-1 underline-offset-2"
              >
                {profile?.display_name || profile?.username}
              </Link>
              <span className="text-muted-foreground/70">·</span>
              <span className="text-muted-foreground/70 text-sm">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: ru,
                }).replace('назад', '').trim()}
              </span>
            </div>
            {post.is_pinned && (
              <Pin className="h-3.5 w-3.5 text-muted-foreground/60" />
            )}
          </div>

          <Link href={`/post/${post.id}`} className="block space-y-2 group/link">
            <h2 className="text-[15px] font-normal text-foreground break-words leading-normal">
              {post.title}
            </h2>
            {displayContent && (
              <p className="text-[15px] text-muted-foreground/80 break-words leading-snug whitespace-pre-wrap">
                {displayContent}
              </p>
            )}
          </Link>

          {/* Media Gallery - Compact mode */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div 
              className="mt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <MediaGallery 
                images={post.media_urls} 
                compact 
                disableHover 
                contentSize={contentSize}
              />
            </div>
          )}

          {/* Audio Player - Compact mode */}
          {post.audio_url && (
            <div 
              className="mt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <AudioPlayerCompact url={post.audio_url} />
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-0.5">
              {tags.slice(0, 3).map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${tag}`}
                  className="text-xs text-primary/70 hover:text-primary hover:underline underline-offset-2"
                >
                  #{tag}
                </Link>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-muted-foreground/60">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-5 pt-2">
            <button 
              onClick={handleLike}
              disabled={isLiking}
              className={`group/like flex items-center gap-1.5 transition-all duration-200 ${
                isLiked 
                  ? 'text-red-500' 
                  : 'text-muted-foreground/60 hover:text-red-500'
              }`}
              aria-label={isLiked ? "Убрать лайк" : "Лайкнуть"}
            >
              <ThumbsUp className={`h-[18px] w-[18px] transition-all ${
                isLiked 
                  ? 'fill-red-500' 
                  : 'group-hover/like:fill-red-500'
              }`} />
              <span className="text-sm tabular-nums font-medium">{likesCount}</span>
            </button>
            
            <div className="flex items-center gap-1.5 text-muted-foreground/60 pointer-events-none">
              <MessageSquare className="h-[18px] w-[18px]" />
              <span className="text-sm tabular-nums font-medium">{post.comment_count || 0}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground/50">
              <Eye className="h-[18px] w-[18px]" />
              <span className="tabular-nums font-medium">{post.views}</span>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <SharePostButton postId={post.id} postTitle={post.title} />
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

// Мемоизация для предотвращения ненужных ре-рендеров
export const PostCard = memo(PostCardComponent, (prevProps, nextProps) => {
  // Перерендерить только если изменился сам пост
  return prevProps.post.id === nextProps.post.id &&
         prevProps.post.likes === nextProps.post.likes &&
         prevProps.post.comment_count === nextProps.post.comment_count &&
         prevProps.post.user_has_liked === nextProps.post.user_has_liked
})
