import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FriendsContent } from "@/components/friends/friends-content"

export const metadata = {
  title: "Друзья",
  description: "Управление друзьями и запросами",
}

export default async function FriendsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 md:py-8 px-4">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Друзья</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Управляйте друзьями и запросами в друзья
        </p>
      </div>

      <FriendsContent userId={user.id} />
    </div>
  )
}
