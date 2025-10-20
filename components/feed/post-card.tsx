"use client"

import { useState, useEffect, memo, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { MessageSquare, Eye, ThumbsUp, ThumbsDown, Pin } from "lucide-react"
import { MediaGallery } from "@/components/media/media-gallery"
import { AudioPlayerCompact } from "@/components/media/audio-player-compact"
import { SharePostButton } from "@/components/post/share-post-button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useReactionsRealtime } from "@/hooks/use-reactions-realtime"
import type { Post } from "@/lib/types"
import { getProfileLink } from "@/lib/utils/profile"

interface PostCardProps {
  post: Post
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
  const tags = post.post_tags?.map((pt) => pt.tags?.name).filter(Boolean) || []
  const profileLink = getProfileLink(profile?.username)
  
  const [userReaction, setUserReaction] = useState<string | null>(post.user_reaction || null)
  const [likesCount, setLikesCount] = useState(post.likes)
  const [dislikesCount, setDislikesCount] = useState(post.dislikes)
  const [isReacting, setIsReacting] = useState(false)
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
      if (reaction.reaction_type === 'like') {
        setLikesCount(prev => prev + 1)
      } else if (reaction.reaction_type === 'dislike') {
        setDislikesCount(prev => prev + 1)
      }
      
      // Если это наша реакция - обновляем статус
      if (reaction.user_id === currentUserId) {
        setUserReaction(reaction.reaction_type)
      }
    },
    onDeleteReaction: (reaction) => {
      // Уменьшаем счетчик на основе типа удаленной реакции
      if (reaction.reaction_type === 'like') {
        setLikesCount(prev => Math.max(0, prev - 1))
      } else if (reaction.reaction_type === 'dislike') {
        setDislikesCount(prev => Math.max(0, prev - 1))
      }

      // Если это была наша реакция - сбрасываем статус
      if (reaction.user_id === currentUserId) {
        setUserReaction(null)
      }
    },
  })

  // Синхронизируем состояние ТОЛЬКО при смене поста (не при каждом изменении likes/dislikes!)
  // Это предотвращает рассинхронизацию между предпросмотром и полным постом
  useEffect(() => {
    setUserReaction(post.user_reaction || null)
    setLikesCount(post.likes || 0)
    setDislikesCount(post.dislikes || 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]) // Только при смене post.id, НЕ при изменении счётчиков!
  
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

  const handleReaction = useCallback(async (reactionType: 'like' | 'dislike', e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isReacting) return

    // Проверка на наличие post.id
    if (!post?.id) {
      console.error('Post ID is missing')
      toast.error('Ошибка: не удалось найти пост')
      return
    }
    
    setIsReacting(true)
    
    // Сохраняем текущее состояние ДО изменений
    const previousReaction = userReaction
    const previousLikes = likesCount
    const previousDislikes = dislikesCount
    
    // МГНОВЕННОЕ оптимистичное обновление UI (без задержек!)
    if (previousReaction === reactionType) {
      // Убираем реакцию
      setUserReaction(null)
      if (reactionType === 'like') {
        setLikesCount(prev => Math.max(0, prev - 1))
      } else {
        setDislikesCount(prev => Math.max(0, prev - 1))
      }
    } else {
      // Меняем или добавляем реакцию
      if (previousReaction === 'like') {
        setLikesCount(prev => Math.max(0, prev - 1))
      } else if (previousReaction === 'dislike') {
        setDislikesCount(prev => Math.max(0, prev - 1))
      }
      
      setUserReaction(reactionType)
      if (reactionType === 'like') {
        setLikesCount(prev => prev + 1)
      } else {
        setDislikesCount(prev => prev + 1)
      }
    }
    
    // Запускаем запрос к серверу в фоне (UI уже обновился!)
    const supabase = createClient()
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        // Откатываем изменения
        setUserReaction(previousReaction)
        setLikesCount(previousLikes)
        setDislikesCount(previousDislikes)
        toast.error('Войдите, чтобы реагировать на посты')
        setIsReacting(false)
        return
      }

      // Определяем действие по ПРЕДЫДУЩЕМУ состоянию
      if (previousReaction === reactionType) {
        // Удаляем реакцию
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .eq('reaction_type', reactionType)
        
        if (error) throw error
      } else {
        // Используем UPSERT для атомарной операции
        // Это автоматически заменит старую реакцию на новую
        const { error } = await supabase
          .from('post_reactions')
          .upsert(
            { 
              post_id: post.id, 
              user_id: user.id,
              reaction_type: reactionType
            },
            {
              onConflict: 'post_id,user_id',
              ignoreDuplicates: false
            }
          )
        
        if (error) throw error
      }
      
      // Успех - оставляем оптимистичное обновление как есть
      setIsReacting(false)
    } catch (error: unknown) {
      // Детальное логирование ошибки
      if (error && typeof error === 'object') {
        const err = error as any
        console.error('[Reaction Error]', {
          message: err.message,
          code: err.code,
          details: err.details,
          hint: err.hint,
          status: err.status,
          full: error
        })
        
        toast.error(err.message || 'Не удалось поставить реакцию')
      } else {
        console.error('[Reaction Error] Unknown:', error)
        toast.error('Произошла ошибка')
      }
      
      // Откатываем изменения только при ошибке
      setUserReaction(previousReaction)
      setLikesCount(previousLikes)
      setDislikesCount(previousDislikes)
      toast.error('Ошибка при обновлении реакции')
      setIsReacting(false)
    }
  }, [userReaction, likesCount, dislikesCount, isReacting, post.id])

  return (
    <article className={`threads-post group relative ${post.is_pinned ? "bg-primary/5" : ""}`}>
      <div className="flex gap-3 px-4 sm:px-5 py-4 sm:py-5">
        {profileLink ? (
          <Link href={profileLink} className="shrink-0 pt-0.5">
            <Avatar className="h-11 w-11 sm:h-9 sm:w-9 ring-1 ring-border">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                {profile?.display_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <div className="shrink-0 pt-0.5">
            <Avatar className="h-11 w-11 sm:h-9 sm:w-9 ring-1 ring-border">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                {(profile?.display_name?.[0] || profile?.username?.[0] || "?").toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[15px]">
              {profileLink ? (
                <Link 
                  href={profileLink} 
                  className="font-semibold hover:underline text-foreground decoration-1 underline-offset-2"
                >
                  {profile?.display_name || profile?.username}
                </Link>
              ) : (
                <span className="font-semibold text-foreground">
                  {profile?.display_name || profile?.username || "Пользователь"}
                </span>
              )}
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
            <h2 className="text-base sm:text-[15px] font-normal text-foreground break-words leading-normal">
              {post.title}
            </h2>
            {displayContent && (
              <p className="text-base sm:text-[15px] text-muted-foreground/80 break-words leading-snug whitespace-pre-wrap">
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

          <div className="flex items-center gap-3 sm:gap-5 pt-3">
            <button 
              onClick={(e) => handleReaction('like', e)}
              disabled={isReacting}
              className={`group/like flex items-center gap-1.5 sm:gap-2 transition-all duration-200 active:scale-95 p-1 -m-1 rounded-lg ${
                userReaction === 'like'
                  ? 'text-green-500' 
                  : 'text-muted-foreground/60 hover:text-green-500 active:bg-green-500/10'
              }`}
              aria-label={userReaction === 'like' ? "Убрать лайк" : "Лайкнуть"}
            >
              <ThumbsUp className={`h-5 w-5 sm:h-[18px] sm:w-[18px] transition-all ${
                userReaction === 'like'
                  ? 'fill-green-500' 
                  : 'group-hover/like:fill-green-500'
              }`} />
              <span className="text-sm sm:text-sm tabular-nums font-medium">{likesCount}</span>
            </button>

            <button 
              onClick={(e) => handleReaction('dislike', e)}
              disabled={isReacting}
              className={`group/dislike flex items-center gap-1.5 sm:gap-2 transition-all duration-200 active:scale-95 p-1 -m-1 rounded-lg ${
                userReaction === 'dislike'
                  ? 'text-red-500' 
                  : 'text-muted-foreground/60 hover:text-red-500 active:bg-red-500/10'
              }`}
              aria-label={userReaction === 'dislike' ? "Убрать дизлайк" : "Дизлайкнуть"}
            >
              <ThumbsDown className={`h-5 w-5 sm:h-[18px] sm:w-[18px] transition-all ${
                userReaction === 'dislike'
                  ? 'fill-red-500' 
                  : 'group-hover/dislike:fill-red-500'
              }`} />
              <span className="text-sm sm:text-sm tabular-nums font-medium">{dislikesCount}</span>
            </button>
            
            <Link
              href={`/post/${post.id}#comments`}
              className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground/60 hover:text-primary transition-colors p-1 -m-1 rounded-lg active:scale-95 active:bg-accent/50"
            >
              <MessageSquare className="h-5 w-5 sm:h-[18px] sm:w-[18px]" />
              <span className="text-sm sm:text-sm tabular-nums font-medium">{post.comment_count || 0}</span>
            </Link>
            
            <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-muted-foreground/50 ml-auto sm:ml-0">
              <Eye className="h-5 w-5 sm:h-[18px] sm:w-[18px]" />
              <span className="tabular-nums font-medium text-sm sm:text-sm">{post.views}</span>
            </div>

            <div onClick={(e) => e.stopPropagation()} className="hidden sm:block">
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
         prevProps.post.dislikes === nextProps.post.dislikes &&
         prevProps.post.comment_count === nextProps.post.comment_count &&
         prevProps.post.user_reaction === nextProps.post.user_reaction
})
