import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FollowingFeed } from "@/components/feed/following-feed"

export const metadata = {
  title: "Подписки | Forum App",
  description: "Посты от людей, на которых вы подписаны"
}

export default async function FollowingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get count of following
  const { count } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", user.id)

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-6">
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Подписки</h1>
          {count !== null && count > 0 && (
            <span className="text-sm text-muted-foreground">
              {count} {count === 1 ? "подписка" : "подписок"}
            </span>
          )}
        </div>
        <p className="text-muted-foreground">
          Посты от пользователей, на которых вы подписаны
        </p>
      </div>

      <FollowingFeed />
    </div>
  )
}
