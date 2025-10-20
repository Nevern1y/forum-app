"use client"

import { useState, useEffect, memo } from "react"
import { CommentItem } from "@/components/post/comment-item"
import { useCommentsRealtime } from "@/hooks/use-comments-realtime"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Comment {
  id: string
  content: string
  likes: number
  dislikes: number
  created_at: string
  author_id: string
  parent_id: string | null
  profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
    reputation: number
  } | null
}

interface CommentListProps {
  comments: Comment[]
  postId: string
}

const CommentListComponent = ({ comments: initialComments, postId }: CommentListProps) => {
  const [comments, setComments] = useState<Comment[]>(initialComments)

  // Realtime подписка на комментарии
  useCommentsRealtime({
    postId,
    onNewComment: async (newComment) => {
      // Загружаем полные данные комментария с профилем
      const supabase = createClient()
      const { data: fullComment } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:author_id (username, display_name, avatar_url, reputation)
        `)
        .eq("id", newComment.id)
        .single()

      if (fullComment && !fullComment.parent_id) {
        // Добавляем только комментарии верхнего уровня
        setComments(prev => [fullComment, ...prev])
        toast.success("Новый комментарий!")
      }
    },
    onUpdateComment: (updatedComment) => {
      setComments(prev =>
        prev.map(comment =>
          comment.id === updatedComment.id
            ? { ...comment, ...updatedComment }
            : comment
        )
      )
    },
    onDeleteComment: (commentId) => {
      setComments(prev => prev.filter(comment => comment.id !== commentId))
      toast.info("Комментарий удален")
    },
  })

  // Синхронизируем с initialComments при изменении
  useEffect(() => {
    setComments(initialComments)
  }, [initialComments])

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} postId={postId} />
      ))}
    </div>
  )
}

// Мемоизация для предотвращения ненужных ре-рендеров
export const CommentList = memo(CommentListComponent, (prevProps, nextProps) => {
  // Перерендерить только если изменились комментарии или postId
  return (
    prevProps.postId === nextProps.postId &&
    prevProps.comments.length === nextProps.comments.length &&
    prevProps.comments.every((comment, index) => 
      comment.id === nextProps.comments[index]?.id &&
      comment.likes === nextProps.comments[index]?.likes &&
      comment.dislikes === nextProps.comments[index]?.dislikes
    )
  )
})
