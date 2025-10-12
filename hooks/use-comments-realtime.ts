"use client"

import { useRealtime } from "./use-realtime"

interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

interface UseCommentsRealtimeOptions {
  postId?: string
  onNewComment?: (comment: Comment) => void
  onUpdateComment?: (comment: Comment) => void
  onDeleteComment?: (commentId: string) => void
}

/**
 * Хук для подписки на изменения комментариев в realtime
 */
export function useCommentsRealtime({
  postId,
  onNewComment,
  onUpdateComment,
  onDeleteComment,
}: UseCommentsRealtimeOptions = {}) {
  useRealtime<Comment>({
    table: "comments",
    filter: postId ? `post_id=eq.${postId}` : undefined,
    onInsert: (comment) => {
      onNewComment?.(comment)
    },
    onUpdate: ({ new: comment }) => {
      onUpdateComment?.(comment)
    },
    onDelete: (comment) => {
      onDeleteComment?.(comment.id)
    },
  })
}
