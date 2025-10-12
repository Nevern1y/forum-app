import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Heart, MessageCircle } from "lucide-react"

interface UserCommentsProps {
  userId: string
}

export async function UserComments({ userId }: UserCommentsProps) {
  const supabase = await createClient()

  const { data: comments } = await supabase
    .from("comments")
    .select(`
      *,
      posts:post_id (id, title)
    `)
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(20)

  if (!comments || comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <span className="text-4xl">💬</span>
        </div>
        <p className="text-[15px] font-medium text-foreground mb-1">Нет ответов</p>
        <p className="text-[13px] text-muted-foreground">Ответы появятся здесь</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 py-6">
      {comments.map((comment) => (
        <Link 
          key={comment.id} 
          href={`/post/${comment.posts?.id}#comment-${comment.id}`}
          className="group block"
        >
          <article className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 dark:bg-[#181818] backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-lg hover:border-blue-500/20 hover:bg-card dark:hover:bg-[#181818]">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
              {/* Post context with better styling */}
              <div className="flex items-center gap-2 text-[13px] mb-3 pb-3 border-b border-border/30">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <MessageCircle className="h-[14px] w-[14px]" />
                  <span className="font-medium">Ответ в посте</span>
                </div>
                <span className="text-muted-foreground">→</span>
                <span className="font-semibold text-foreground line-clamp-1 group-hover:text-blue-500 transition-colors flex-1">
                  {comment.posts?.title}
                </span>
              </div>

              {/* Comment content */}
              <p className="text-[15px] leading-relaxed mb-4 whitespace-pre-wrap line-clamp-3 text-foreground/90">
                {comment.content}
              </p>

              {/* Meta */}
              <div className="flex items-center justify-between pt-3 border-t border-border/30">
                {/* Stats */}
                <div className="flex items-center gap-5 text-[13px] text-muted-foreground/70">
                  <span className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                    <Heart className="h-[15px] w-[15px]" />
                    <span className="font-medium tabular-nums">{comment.likes}</span>
                  </span>
                </div>

                {/* Date */}
                <time className="text-[13px] text-muted-foreground/70 font-medium">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </time>
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  )
}
