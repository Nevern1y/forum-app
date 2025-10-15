import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { WhatsAppStyleMessages } from "@/components/messages/whatsapp-style-messages"

export const metadata = {
  title: "Сообщения",
  description: "Личные сообщения",
}

export default async function MessagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Получаем профиль пользователя
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-144px)] md:min-h-[calc(100vh-80px)] px-4 py-4 md:py-6">
      <div className="w-full max-w-6xl">
        <WhatsAppStyleMessages
          userId={user.id}
          currentUser={{
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          }}
        />
      </div>
    </div>
  )
}
