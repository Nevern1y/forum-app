"use client"

import { useRealtime } from "./use-realtime"

interface Post {
  id: string
  title: string
  content: string
  user_id: string
  created_at: string
  updated_at: string
}

interface UsePostsRealtimeOptions {
  onNewPost?: (post: Post) => void
  onUpdatePost?: (post: Post) => void
  onDeletePost?: (postId: string) => void
  userId?: string // Фильтр по пользователю
}

/**
 * Хук для подписки на изменения постов в realtime
 */
export function usePostsRealtime({
  onNewPost,
  onUpdatePost,
  onDeletePost,
  userId,
}: UsePostsRealtimeOptions = {}) {
  useRealtime<Post>({
    table: "posts",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onInsert: (post) => {
      onNewPost?.(post)
    },
    onUpdate: ({ new: post }) => {
      onUpdatePost?.(post)
    },
    onDelete: (post) => {
      onDeletePost?.(post.id)
    },
  })
}
