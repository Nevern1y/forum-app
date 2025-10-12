import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { EditPostForm } from "@/components/post/edit-post-form"

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get post data
  const { data: post, error } = await supabase
    .from("posts")
    .select(`
      *,
      post_tags (
        tags (id, name)
      )
    `)
    .eq("id", id)
    .single()

  if (error || !post) {
    notFound()
  }

  // Check if user is the author
  if (post.author_id !== user.id) {
    redirect(`/post/${id}`)
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Редактировать пост</h1>
          <p className="text-muted-foreground">Внесите изменения в ваш пост</p>
        </div>
        <EditPostForm 
          post={post} 
          existingTags={post.post_tags.map((pt: any) => pt.tags).filter(Boolean)}
        />
      </div>
    </div>
  )
}
