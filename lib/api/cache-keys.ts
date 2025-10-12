/**
 * Константы для ключей кэша
 */

export const CACHE_KEYS = {
  // Посты
  POSTS_FEED: (sortBy: string) => `posts:feed:${sortBy}`,
  POST_DETAIL: (id: string) => `post:${id}`,
  POST_COMMENTS: (id: string) => `post:${id}:comments`,
  
  // Пользователи
  USER_PROFILE: (username: string) => `user:${username}`,
  USER_POSTS: (username: string) => `user:${username}:posts`,
  USER_STATS: (userId: string) => `user:${userId}:stats`,
  
  // Уведомления
  NOTIFICATIONS: (userId: string) => `notifications:${userId}`,
  NOTIFICATIONS_COUNT: (userId: string) => `notifications:${userId}:count`,
  
  // Друзья
  FRIENDS: (userId: string) => `friends:${userId}`,
  FRIEND_REQUESTS: (userId: string) => `friend-requests:${userId}`,
  
  // Сообщения
  CONVERSATIONS: (userId: string) => `conversations:${userId}`,
  MESSAGES: (conversationId: string) => `messages:${conversationId}`,
  
  // Тренды
  TRENDING_TOPICS: 'trending:topics',
  TRENDING_POSTS: 'trending:posts',
  
  // Лидерборд
  LEADERBOARD: 'leaderboard',
}

/**
 * Время жизни кэша (в миллисекундах)
 */
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 минута
  MEDIUM: 5 * 60 * 1000,     // 5 минут
  LONG: 15 * 60 * 1000,      // 15 минут
  VERY_LONG: 60 * 60 * 1000, // 1 час
}
