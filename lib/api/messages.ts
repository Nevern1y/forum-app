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
 * Context7 Optimization: Explicit filters + limited columns
 */
export async function getConversations(userId: string) {
  const supabase = createClient()

  // Context7 Best Practice: Add explicit filter even with RLS
  // This helps PostgreSQL build better query plans
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      id,
      user1_id,
      user2_id,
      last_message_at,
      last_message_preview,
      unread_count_user1,
      unread_count_user2,
      created_at,
      user1:user1_id (id, username, display_name, avatar_url),
      user2:user2_id (id, username, display_name, avatar_url)
    `
    )
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`) // Explicit filter!
    .order("last_message_at", { ascending: false })
    .limit(50) // Context7: Always add limits

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
          shared_post_id
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
 * Context7 Optimization: Explicit filters + safe limits
 */
export async function getMessages(conversationId: string, limit: number = 50) {
  const supabase = createClient()
  
  // Context7 Best Practice: Limit max page size
  const safeLimit = Math.min(limit, 100)

  try {
    // Context7 Best Practice: Explicit filter for better query plans
    const { data, error } = await supabase
      .from("direct_messages")
      .select(
        `
        id,
        conversation_id,
        sender_id,
        receiver_id,
        content,
        media_urls,
        audio_url,
        shared_post_id,
        is_read,
        read_at,
        created_at,
        sender:sender_id (id, username, display_name, avatar_url)
      `
      )
      .eq("conversation_id", conversationId) // Explicit filter!
      .order("created_at", { ascending: false })
      .limit(safeLimit) // Safe limit

    if (error) {
      console.error("Error getting messages:", error)
      return []
    }

    // Отдельно загрузить информацию о постах для сообщений с shared_post_id
    const messagesWithPosts = data || []
    const postIds = [...new Set(messagesWithPosts
      .filter(msg => msg.shared_post_id)
      .map(msg => msg.shared_post_id))]

    if (postIds.length > 0) {
      try {
        // Context7: Select only needed columns
        const { data: posts, error: postsError } = await supabase
          .from("posts")
          .select("id, title, views, media_urls")
          .in("id", postIds) // Explicit filter
          .limit(postIds.length) // Exact limit

        if (postsError) {
          console.error("Error loading posts for messages:", postsError)
        } else if (posts && posts.length > 0) {
          const postsMap = new Map(posts.map(p => [p.id, p]))
          messagesWithPosts.forEach(msg => {
            if (msg.shared_post_id) {
              msg.shared_post = postsMap.get(msg.shared_post_id) || null
            }
          })
        }
      } catch (postsErr) {
        console.error("Failed to load posts:", postsErr)
        // Продолжаем без постов
      }
    }

    return messagesWithPosts.reverse()
  } catch (error) {
    console.error("Error getting messages:", error)
    return []
  }
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
 * Context7 Optimization: Explicit filters for performance
 */
export async function markMessagesAsRead(conversationId: string, userId: string) {
  const supabase = createClient()

  // Context7: Multiple explicit filters for better index usage
  const { error } = await supabase
    .from("direct_messages")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("conversation_id", conversationId) // Explicit filter 1
    .eq("receiver_id", userId)              // Explicit filter 2
    .eq("is_read", false)                   // Explicit filter 3

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
