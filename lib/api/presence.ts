import { createClient } from "@/lib/supabase/client"

export interface UserPresence {
  user_id: string
  online: boolean
  last_seen: string
}

/**
 * Подписаться на присутствие пользователя
 */
export function subscribeToUserPresence(
  userId: string,
  onPresenceChange: (presence: UserPresence[]) => void
) {
  const supabase = createClient()

  const channel = supabase
    .channel(`presence:${userId}`)
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState()
      const users = Object.values(state).flat() as unknown as UserPresence[]
      onPresenceChange(users)
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Транслировать свой онлайн-статус
 */
export async function broadcastPresence() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const channel = supabase.channel("online-users")

  await channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({
        user_id: user.id,
        online_at: new Date().toISOString(),
      })
    }
  })

  // Обновлять присутствие каждые 30 секунд
  const interval = setInterval(async () => {
    await channel.track({
      user_id: user.id,
      online_at: new Date().toISOString(),
    })
  }, 30000)

  return () => {
    clearInterval(interval)
    channel.untrack()
    supabase.removeChannel(channel)
  }
}

/**
 * Получить список онлайн пользователей
 */
export function subscribeToOnlineUsers(onUsersChange: (users: string[]) => void) {
  const supabase = createClient()

  const channel = supabase
    .channel("online-users")
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState()
      const userIds = Object.keys(state).map((key) => {
        const presences = state[key] as unknown as Array<{ user_id: string }>
        return presences[0]?.user_id
      }).filter(Boolean)
      
      onUsersChange(userIds)
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
