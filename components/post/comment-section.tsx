import { createClient } from "@/lib/supabase/server"
import { CommentForm } from "@/components/post/comment-form"
import { CommentList } from "@/components/post/comment-list"
import { MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface CommentSectionProps {
  postId: string
}

export async function CommentSection({ postId }: CommentSectionProps) {
  const supabase = await createClient()

  // Get top-level comments (no parent)
  const { data: comments } = await supabase
    .from("comments")
    .select(`
      *,
      profiles:author_id (username, display_name, avatar_url, reputation),
      media_urls,
      audio_url
    `)
    .eq("post_id", postId)
    .is("parent_id", null)
    .order("created_at", { ascending: false })

  const { count: commentCount } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Комментарии</h2>
        <span className="text-muted-foreground">({commentCount || 0})</span>
      </div>

      <CommentForm postId={postId} />

      {comments && comments.length > 0 ? (
        <CommentList comments={comments} postId={postId} />
      ) : (
        <Card className="border-dashed dark:bg-[#181818]">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="rounded-full bg-muted p-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Пока нет комментариев</p>
                <p className="text-sm text-muted-foreground">Будьте первым, кто оставит комментарий!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
