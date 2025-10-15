import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PrivacySettings } from "@/components/settings/privacy-settings"

export default async function PrivacySettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_visibility, show_activity, show_followers, allow_messages, show_email")
    .eq("id", user.id)
    .single()

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Приватность и безопасность</h1>
          <p className="text-sm md:text-base text-muted-foreground">Управляйте тем, кто может видеть вашу информацию</p>
        </div>
        <PrivacySettings userId={user.id} initialSettings={profile || undefined} />
      </div>
    </div>
  )
}
