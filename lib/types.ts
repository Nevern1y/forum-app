// Основные типы для приложения

export interface User {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  reputation: number
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  title: string
  content: string
  author_id: string
  views: number
  likes: number
  dislikes: number
  comment_count: number
  is_pinned: boolean
  media_urls: string[] | null
  audio_url: string | null
  created_at: string
  updated_at: string
  profiles: User | null
  post_tags: Array<{
    tags: {
      name: string
    } | null
  }>
  user_reaction?: string | null
}

export interface Notification {
  id: string
  user_id: string
  type: 'comment' | 'like' | 'follow' | 'mention'
  content: string
  link: string | null
  is_read: boolean
  created_at: string
  related_user_id?: string
  related_post_id?: string
  related_user?: {
    username: string
    display_name: string | null
  }
  related_post?: {
    id: string
    title: string
  }
}

export interface Reaction {
  id: string
  post_id: string
  user_id: string
  reaction_type: 'like' | 'dislike'
  created_at: string
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  parent_id: string | null
  created_at: string
  updated_at: string
  profiles: User | null
  replies?: Comment[]
}

export interface Conversation {
  id: string
  created_at: string
  updated_at: string
  other_user: User
  last_message: Message | null
  unread_count: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  updated_at: string
  sender: User | null
}

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  sender: User | null
  receiver: User | null
}

export interface Tag {
  id: string
  name: string
  created_at: string
}

// Типы для realtime событий
export interface RealtimePayload<T = unknown> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
  table: string
}

// Типы для API ответов
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  hasMore: boolean
}