import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreatePostForm } from "@/components/post/create-post-form"

export default async function CreatePostPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Создать пост</h1>
          <p className="text-sm md:text-base text-muted-foreground">Поделитесь своими мыслями с сообществом</p>
        </div>
        <CreatePostForm />
      </div>
    </div>
  )
}
