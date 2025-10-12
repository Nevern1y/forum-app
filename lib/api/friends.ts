import { createClient } from "@/lib/supabase/client"

export type FriendshipStatus = "pending" | "accepted" | "rejected" | "blocked"

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: FriendshipStatus
  created_at: string
  accepted_at: string | null
}

export interface FriendProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
}

/**
 * Получить статус дружбы между двумя пользователями
 */
export async function getFriendshipStatus(userId: string, friendId: string) {
  const supabase = createClient()

  // Проверяем в обе стороны - сначала в одном направлении
  let { data, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("user_id", userId)
    .eq("friend_id", friendId)
    .maybeSingle()

  if (error && error.code !== "PGRST116") {
    console.error("Error getting friendship status:", error)
    return null
  }

  // Если не нашли, проверяем в обратном направлении
  if (!data) {
    const result = await supabase
      .from("friendships")
      .select("*")
      .eq("user_id", friendId)
      .eq("friend_id", userId)
      .maybeSingle()

    if (result.error && result.error.code !== "PGRST116") {
      console.error("Error getting friendship status (reverse):", result.error)
      return null
    }

    data = result.data
  }

  return data
}

/**
 * Отправить запрос в друзья
 */
export async function sendFriendRequest(friendId: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Необходима авторизация")

  // Проверяем, что не пытаемся добавить самого себя
  if (user.id === friendId) {
    throw new Error("Нельзя добавить себя в друзья")
  }

  // Проверяем, нет ли уже запроса
  const existing = await getFriendshipStatus(user.id, friendId)
  if (existing) {
    if (existing.status === "pending") {
      throw new Error("Запрос уже отправлен")
    } else if (existing.status === "accepted") {
      throw new Error("Уже в друзьях")
    } else if (existing.status === "blocked") {
      throw new Error("Пользователь заблокирован")
    }
  }

  const { data, error } = await supabase
    .from("friendships")
    .insert({
      user_id: user.id,
      friend_id: friendId,
      status: "pending",
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating friend request:", {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })
    throw new Error(error.message || "Не удалось отправить запрос в друзья")
  }
  return data
}

/**
 * Принять запрос в друзья
 */
export async function acceptFriendRequest(friendshipId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("friendships")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", friendshipId)
    .select()
    .single()

  if (error) {
    console.error("Error accepting friend request:", error)
    throw new Error(error.message || "Не удалось принять запрос")
  }
  return data
}

/**
 * Отклонить запрос в друзья
 */
export async function rejectFriendRequest(friendshipId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("friendships")
    .update({
      status: "rejected",
    })
    .eq("id", friendshipId)
    .select()
    .single()

  if (error) {
    console.error("Error rejecting friend request:", error)
    throw new Error(error.message || "Не удалось отклонить запрос")
  }
  return data
}

/**
 * Удалить из друзей или отменить запрос
 */
export async function removeFriend(friendshipId: string) {
  const supabase = createClient()

  const { error } = await supabase.from("friendships").delete().eq("id", friendshipId)

  if (error) {
    console.error("Error removing friend:", error)
    throw new Error(error.message || "Не удалось удалить")
  }
}

/**
 * Заблокировать пользователя
 */
export async function blockUser(userId: string, friendId: string) {
  const supabase = createClient()

  // Удаляем существующую дружбу, если есть
  const existing = await getFriendshipStatus(userId, friendId)
  if (existing) {
    await removeFriend(existing.id)
  }

  // Создаем блокировку
  const { data, error } = await supabase
    .from("friendships")
    .insert({
      user_id: userId,
      friend_id: friendId,
      status: "blocked",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Получить список друзей пользователя
 */
export async function getFriends(userId: string) {
  const supabase = createClient()

  console.log("[getFriends] Fetching friends for user:", userId)

  // Получаем друзей где текущий пользователь - инициатор (user_id)
  const { data: sentFriends, error: sentError } = await supabase
    .from("friendships")
    .select(
      `
      *,
      friend:friend_id (
        id,
        username,
        display_name,
        avatar_url,
        bio
      )
    `
    )
    .eq("user_id", userId)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false })

  if (sentError) {
    console.error("[getFriends] Error getting sent friends:", sentError)
  }

  // Получаем друзей где текущий пользователь - получатель (friend_id)
  const { data: receivedFriends, error: receivedError } = await supabase
    .from("friendships")
    .select(
      `
      *,
      user:user_id (
        id,
        username,
        display_name,
        avatar_url,
        bio
      )
    `
    )
    .eq("friend_id", userId)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false })

  if (receivedError) {
    console.error("[getFriends] Error getting received friends:", receivedError)
  }

  // Объединяем и нормализуем данные
  const allFriends = [
    ...(sentFriends || []).map((f) => ({ ...f, friend: f.friend })),
    ...(receivedFriends || []).map((f) => ({ ...f, friend: f.user })),
  ]

  console.log("[getFriends] Found friends:", allFriends.length, allFriends)
  return allFriends
}

/**
 * Получить входящие запросы в друзья
 */
export async function getIncomingRequests(userId: string) {
  const supabase = createClient()

  console.log("[getIncomingRequests] Fetching incoming requests for user:", userId)

  const { data, error } = await supabase
    .from("friendships")
    .select(
      `
      *,
      requester:user_id (
        id,
        username,
        display_name,
        avatar_url,
        bio
      )
    `
    )
    .eq("friend_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getIncomingRequests] Error getting incoming requests:", error)
    return []
  }

  console.log("[getIncomingRequests] Found incoming requests:", data?.length || 0, data)
  return data
}

/**
 * Получить исходящие запросы в друзья
 */
export async function getOutgoingRequests(userId: string) {
  const supabase = createClient()

  console.log("[getOutgoingRequests] Fetching outgoing requests for user:", userId)

  const { data, error } = await supabase
    .from("friendships")
    .select(
      `
      *,
      friend:friend_id (
        id,
        username,
        display_name,
        avatar_url,
        bio
      )
    `
    )
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getOutgoingRequests] Error getting outgoing requests:", error)
    return []
  }

  console.log("[getOutgoingRequests] Found outgoing requests:", data?.length || 0, data)
  return data
}

/**
 * Проверить, являются ли пользователи друзьями
 */
export async function areFriends(userId: string, friendId: string): Promise<boolean> {
  const friendship = await getFriendshipStatus(userId, friendId)
  return friendship?.status === "accepted"
}
