import { createClient } from "@/lib/supabase/client"

export interface DirectMessage {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string
  content: string
  media_urls: string[] | null
  audio_url: string | null
  shared_post_id: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  last_message_at: string
  last_message_preview: string | null
  unread_count_user1: number
  unread_count_user2: number
  created_at: string
}

/**
 * Получить или создать беседу с пользователем
 */
export async function getOrCreateConversation(user1Id: string, user2Id: string) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("get_or_create_conversation", {
    user1_id: user1Id,
    user2_id: user2Id,
  })

  if (error) {
    console.error("Error getting/creating conversation:", error)
    throw error
  }

  return data as string
}

/**
 * Получить список бесед пользователя
 */
export async function getConversations(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      *,
      user1:user1_id (id, username, display_name, avatar_url),
      user2:user2_id (id, username, display_name, avatar_url)
    `
    )
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order("last_message_at", { ascending: false })

  if (error) {
    console.error("Error getting conversations:", error)
    return []
  }

  // Получить последнее сообщение для каждой беседы с информацией о посте
  const conversationsWithLastMessage = await Promise.all(
    data.map(async (conv) => {
      const { data: lastMessage } = await supabase
        .from("direct_messages")
        .select(`
          id,
          content,
          audio_url,
          media_urls,
          shared_post_id,
          shared_post:shared_post_id (
            id,
            title,
            views
          )
        `)
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      // Определяем, кто является "другим" пользователем
      const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1
      
      // Определяем количество непрочитанных для текущего пользователя
      const unreadCount = conv.user1_id === userId 
        ? conv.unread_count_user1 
        : conv.unread_count_user2

      return {
        ...conv,
        other_user: otherUser,
        unread_count: unreadCount,
        last_message: lastMessage || null
      }
    })
  )

  return conversationsWithLastMessage
}

/**
 * Получить сообщения из беседы
 */
export async function getMessages(conversationId: string, limit: number = 50) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("direct_messages")
    .select(
      `
      *,
      sender:sender_id (id, username, display_name, avatar_url),
      shared_post:shared_post_id (
        id, 
        title, 
        content,
        views
      )
    `
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error getting messages:", error)
    return []
  }

  return data.reverse()
}

/**
 * Отправить сообщение
 */
export async function sendMessage(
  conversationId: string,
  receiverId: string,
  content: string,
  mediaUrls?: string[],
  audioUrl?: string,
  sharedPostId?: string
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Необходима авторизация")

  const { data, error } = await supabase
    .from("direct_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      receiver_id: receiverId,
      content: content || "",
      media_urls: mediaUrls && mediaUrls.length > 0 ? mediaUrls : null,
      audio_url: audioUrl || null,
      shared_post_id: sharedPostId || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Пометить сообщения как прочитанные
 */
export async function markMessagesAsRead(conversationId: string, userId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("direct_messages")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("conversation_id", conversationId)
    .eq("receiver_id", userId)
    .eq("is_read", false)

  if (error) {
    console.error("Error marking messages as read:", error)
    throw error
  }
}

/**
 * Удалить сообщение
 */
export async function deleteMessage(messageId: string) {
  const supabase = createClient()

  const { error } = await supabase.from("direct_messages").delete().eq("id", messageId)

  if (error) throw error
}

/**
 * Получить количество непрочитанных сообщений
 */
export async function getUnreadCount(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("get_unread_messages_count", {
    for_user_id: userId,
  })

  if (error) {
    console.error("Error getting unread count:", error)
    return 0
  }

  return data as number
}
