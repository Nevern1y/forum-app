import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ChatWindow } from "@/components/messages/chat-window"

interface ChatPageProps {
  params: {
    username: string
  }
}

export async function generateMetadata({ params }: ChatPageProps) {
  return {
    title: `Чат с ${params.username}`,
    description: "Личные сообщения",
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Получить профиль собеседника
  const { data: otherUserProfile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", params.username)
    .single()

  if (error || !otherUserProfile) {
    notFound()
  }

  // Не может писать самому себе
  if (otherUserProfile.id === user.id) {
    redirect("/messages")
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-6xl mx-auto px-4 py-4">
      <ChatWindow currentUserId={user.id} otherUser={otherUserProfile} />
    </div>
  )
}
