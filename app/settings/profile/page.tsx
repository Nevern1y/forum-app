import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileEditForm } from "@/components/settings/profile-edit-form"

export default async function ProfileSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Настройки профиля</h1>
          <p className="text-muted-foreground">Управляйте информацией вашего профиля</p>
        </div>
        <ProfileEditForm profile={profile} />
      </div>
    </div>
  )
}
