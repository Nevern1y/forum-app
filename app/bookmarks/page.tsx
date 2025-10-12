import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Bookmark, Eye, Heart, MessageCircle } from "lucide-react"

export default async function BookmarksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select(`
      *,
      posts (
        *,
        profiles:author_id (username, display_name, avatar_url),
        post_tags (
          tags (name)
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-6">
      <div className="space-y-4">
        <div className="pb-4 border-b">
          <h1 className="text-[24px] font-bold">Закладки</h1>
          <p className="text-[15px] text-muted-foreground">Сохранённые посты</p>
        </div>

        {!bookmarks || bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-4">
              <Bookmark className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-[15px] font-medium mb-1">Нет закладок</p>
            <p className="text-[15px] text-muted-foreground">
              Сохраняйте посты, чтобы быстро находить их позже
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {bookmarks.map((bookmark) => {
              const post = bookmark.posts
              if (!post) return null

              const profile = post.profiles

              return (
                <Link 
                  key={bookmark.id} 
                  href={`/post/${post.id}`}
                  className="block py-6 hover:bg-muted/30 transition-colors -mx-4 px-4"
                >
                  <article>
                    {/* Author & Date */}
                    <div className="flex items-center gap-2 text-[13px] text-muted-foreground mb-2">
                      <span className="font-medium text-foreground">
                        {profile?.display_name || profile?.username}
                      </span>
                      <span>·</span>
                      <time>
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </time>
                    </div>

                    {/* Title */}
                    <h2 className="text-[17px] font-semibold leading-snug mb-2 hover:underline">
                      {post.title}
                    </h2>

                    {/* Preview */}
                    {post.content && (
                      <p className="text-[15px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                        {post.content.substring(0, 200)}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-[14px] w-[14px]" />
                        {post.views}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Heart className="h-[14px] w-[14px]" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="h-[14px] w-[14px]" />
                        {post.comment_count || 0}
                      </span>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
