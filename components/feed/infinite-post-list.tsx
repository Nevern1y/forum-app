"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { createClient } from "@/lib/supabase/client"
import { PostCard } from "./post-card"
import { PostSkeletonList } from "@/components/skeletons/post-skeleton"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePostsRealtime } from "@/hooks/use-posts-realtime"
import { toast } from "sonner"
import type { Post } from "@/lib/types"

interface InfinitePostListProps {
  initialPosts: Post[]
  sortBy: string
}

const POSTS_PER_PAGE = 10

export function InfinitePostList({ initialPosts, sortBy }: InfinitePostListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialPosts.length === POSTS_PER_PAGE)
  const [isLoading, setIsLoading] = useState(false)
  const [newPostsCount, setNewPostsCount] = useState(0)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const parentRef = useRef<HTMLDivElement>(null)

  // Виртуализация для оптимизации рендеринга больших списков
  const rowVirtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Средняя высота поста
    overscan: 5, // Рендерить 5 дополнительных элементов за пределами видимости
  })

  // Realtime подписка на новые посты
  usePostsRealtime({
    onNewPost: async (newPost) => {
      // Загружаем полные данные поста
      const supabase = createClient()
      const { data: fullPost } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:author_id (username, display_name, avatar_url, reputation),
          post_tags (
            tags (name)
          )
        `)
        .eq("id", newPost.id)
        .single()

      if (fullPost) {
        // Добавляем пост в начало только если сортировка по дате
        if (sortBy === "recent") {
          setPosts(prev => [fullPost, ...prev])
          toast.success("Новый пост появился!")
        } else {
          // Для других сортировок просто показываем уведомление
          setNewPostsCount(prev => prev + 1)
        }
      }
    },
    onUpdatePost: (updatedPost) => {
      // Обновляем пост в списке
      setPosts(prev => 
        prev.map(post => 
          post.id === updatedPost.id 
            ? { ...post, ...updatedPost } 
            : post
        )
      )
    },
    onDeletePost: (postId) => {
      // Удаляем пост из списка
      setPosts(prev => prev.filter(post => post.id !== postId))
      toast.info("Пост был удален")
    },
  })

  const loadMorePosts = useCallback(async (prefetch = false) => {
    if (isLoading || !hasMore) return

    if (!prefetch) setIsLoading(true)
    const supabase = createClient()

    try {
      let query = supabase
        .from("posts")
        .select(`
          *,
          profiles:author_id (username, display_name, avatar_url, reputation),
          post_tags (
            tags (name)
          )
        `)
        .range(page * POSTS_PER_PAGE, (page + 1) * POSTS_PER_PAGE - 1)

      // Apply sorting
      if (sortBy === "popular") {
        query = query.order("likes", { ascending: false })
      } else if (sortBy === "discussed") {
        // This would need a comment count, for now use views
        query = query.order("views", { ascending: false })
      } else {
        query = query.order("created_at", { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error

      if (data && data.length > 0) {
        setPosts(prev => [...prev, ...data])
        setPage(prev => prev + 1)
        setHasMore(data.length === POSTS_PER_PAGE)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Error loading more posts:", error)
      setHasMore(false)
    } finally {
      if (!prefetch) setIsLoading(false)
    }
  }, [page, sortBy, isLoading, hasMore])

  // Prefetch следующей страницы когда пользователь приближается к концу
  useEffect(() => {
    const items = rowVirtualizer.getVirtualItems()
    if (items.length === 0) return

    const lastItem = items[items.length - 1]
    // Если просмотрено 80% постов - начать prefetch
    if (lastItem && lastItem.index >= posts.length - Math.ceil(POSTS_PER_PAGE * 0.2)) {
      if (hasMore && !isLoading) {
        loadMorePosts(true) // Тихая предзагрузка
      }
    }
  }, [rowVirtualizer, posts.length, hasMore, isLoading, loadMorePosts])

  useEffect(() => {
    // Setup intersection observer for infinite scroll
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMorePosts()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoading, loadMorePosts])

  // Reset when sort changes
  useEffect(() => {
    setPosts(initialPosts)
    setPage(1)
    setHasMore(initialPosts.length === POSTS_PER_PAGE)
  }, [sortBy, initialPosts])

  const loadNewPosts = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:author_id (username, display_name, avatar_url, reputation),
          post_tags (
            tags (name)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(POSTS_PER_PAGE)

      if (error) throw error

      if (data) {
        setPosts(data)
        setNewPostsCount(0)
        setPage(1)
        setHasMore(data.length === POSTS_PER_PAGE)
      }
    } catch (error) {
      console.error("Error loading new posts:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const virtualItems = rowVirtualizer.getVirtualItems()

  return (
    <div ref={parentRef} className="space-y-4" style={{ overflowY: 'auto', maxHeight: '100vh' }}>
      {/* Кнопка для загрузки новых постов */}
      {newPostsCount > 0 && sortBy !== "recent" && (
        <Button
          onClick={loadNewPosts}
          variant="outline"
          className="w-full"
        >
          Загрузить {newPostsCount} {newPostsCount === 1 ? "новый пост" : "новых постов"}
        </Button>
      )}

      {/* Empty state */}
      {posts.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Нет постов для отображения</p>
        </div>
      )}

      {/* Виртуализированный список постов */}
      {posts.length > 0 && (
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const post = posts[virtualItem.index]
            if (!post) return null
            return (
              <div
                key={post.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                ref={rowVirtualizer.measureElement}
                data-index={virtualItem.index}
              >
                <PostCard post={post} />
              </div>
            )
          })}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && <PostSkeletonList count={3} />}

      {/* Intersection observer target */}
      <div ref={loadMoreRef} className="h-10" />

      {/* End of list */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Вы просмотрели все посты</p>
        </div>
      )}

      {/* Load more button (fallback) */}
      {hasMore && !isLoading && posts.length >= POSTS_PER_PAGE && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => loadMorePosts()}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              "Загрузить еще"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
