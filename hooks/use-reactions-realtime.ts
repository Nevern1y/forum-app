"use client"

import { useRealtime } from "./use-realtime"

interface Reaction {
  id: string
  post_id: string
  user_id: string
  reaction_type: string
  emoji?: string | null
  created_at: string
}

interface UseReactionsRealtimeOptions {
  postId?: string
  onNewReaction?: (reaction: Reaction) => void
  onDeleteReaction?: (reactionId: string) => void
  onReactionsChange?: () => void
}

/**
 * Хук для подписки на изменения реакций в realtime
 */
export function useReactionsRealtime({
  postId,
  onNewReaction,
  onDeleteReaction,
  onReactionsChange,
}: UseReactionsRealtimeOptions = {}) {
  useRealtime<Reaction>({
    table: "post_reactions",
    filter: postId ? `post_id=eq.${postId}` : undefined,
    onInsert: (reaction) => {
      onNewReaction?.(reaction)
      onReactionsChange?.()
    },
    onDelete: (reaction) => {
      onDeleteReaction?.(reaction.id)
      onReactionsChange?.()
    },
  })
}
