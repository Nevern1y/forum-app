import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPosts } from "@/components/profile/user-posts"
import { UserComments } from "@/components/profile/user-comments"
import { ProfileHeader } from "@/components/profile/profile-header"

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get profile data
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("username", username).single()

  if (error || !profile) {
    notFound()
  }

  // Get post count
  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", profile.id)

  // Get comment count
  const { count: commentCount } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("author_id", profile.id)

  // Get follower count
  const { count: followerCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id)

  // Get following count
  const { count: followingCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profile.id)

  // Check if current user follows this profile
  const { data: followData } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("follower_id", user.id)
    .eq("following_id", profile.id)
    .single()

  const isOwnProfile = user.id === profile.id
  const isFollowing = !!followData

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-6">
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        stats={{
          postCount: postCount || 0,
          followerCount: followerCount || 0,
          followingCount: followingCount || 0,
          commentCount: commentCount || 0
        }}
      />

      <div className="mt-8">
        <Tabs defaultValue="posts" className="w-full">
          <div className="mb-6">
            <TabsList className="w-full h-auto p-1.5 bg-muted/30 rounded-2xl justify-center gap-2">
              <TabsTrigger 
                value="posts" 
                className="group flex-1 sm:flex-none rounded-xl py-3 px-5 font-semibold text-[15px] data-[state=inactive]:text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md hover:text-foreground transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2.5">
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/30 group-data-[state=active]:border-amber-500/50 group-data-[state=active]:shadow-sm group-data-[state=active]:shadow-amber-500/20 transition-all duration-200">
                    <span className="text-lg">📝</span>
                  </span>
                  <span className="hidden sm:inline">Посты</span>
                  {postCount > 0 && (
                    <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-lg tabular-nums group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-primary transition-all duration-200">
                      {postCount}
                    </span>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="comments" 
                className="group flex-1 sm:flex-none rounded-xl py-3 px-5 font-semibold text-[15px] data-[state=inactive]:text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md hover:text-foreground transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2.5">
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/30 group-data-[state=active]:border-blue-500/50 group-data-[state=active]:shadow-sm group-data-[state=active]:shadow-blue-500/20 transition-all duration-200">
                    <span className="text-lg">💬</span>
                  </span>
                  <span className="hidden sm:inline">Ответы</span>
                  {commentCount > 0 && (
                    <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-lg tabular-nums group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-primary transition-all duration-200">
                      {commentCount}
                    </span>
                  )}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="posts" className="mt-0">
            <UserPosts userId={profile.id} />
          </TabsContent>
          <TabsContent value="comments" className="mt-0">
            <UserComments userId={profile.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
