import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Eye, Heart, MessageCircle, Share2 } from "lucide-react"

interface UserPostsProps {
  userId: string
}

export async function UserPosts({ userId }: UserPostsProps) {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:author_id (username, display_name, avatar_url)
    `)
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(20)

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <span className="text-4xl">📝</span>
        </div>
        <p className="text-[15px] font-medium text-foreground mb-1">Нет постов</p>
        <p className="text-[13px] text-muted-foreground">Посты появятся здесь</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 py-6">
      {posts.map((post) => (
        <Link 
          key={post.id} 
          href={`/post/${post.id}`}
          className="group block"
        >
          <article className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 dark:bg-[#181818] backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:bg-card dark:hover:bg-[#181818]">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
              {/* Title */}
              <h2 className="text-[17px] font-bold leading-snug mb-2 group-hover:text-primary transition-colors">
                {post.title}
              </h2>

              {/* Preview */}
              {post.content && (
                <p className="text-[15px] text-muted-foreground/90 leading-relaxed line-clamp-2 mb-4">
                  {post.content.substring(0, 200)}
                </p>
              )}

              {/* Meta + Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border/30">
                {/* Stats */}
                <div className="flex items-center gap-5 text-[13px] text-muted-foreground/70">
                  <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Eye className="h-[15px] w-[15px]" />
                    <span className="font-medium tabular-nums">{post.views}</span>
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                    <Heart className="h-[15px] w-[15px]" />
                    <span className="font-medium tabular-nums">{post.likes}</span>
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                    <MessageCircle className="h-[15px] w-[15px]" />
                    <span className="font-medium tabular-nums">{post.comment_count || 0}</span>
                  </span>
                </div>

                {/* Date */}
                <time className="text-[13px] text-muted-foreground/70 font-medium">
                  {formatDistanceToNow(new Date(post.created_at), {
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
