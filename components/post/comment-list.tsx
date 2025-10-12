"use client"

import { CommentItem } from "@/components/post/comment-item"

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

export function CommentList({ comments, postId }: CommentListProps) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} postId={postId} />
      ))}
    </div>
  )
}
