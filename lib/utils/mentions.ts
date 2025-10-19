import { createClient } from "@/lib/supabase/client"

/**
 * Парсит текст и находит все упоминания @username
 */
export function parseMentions(text: string): string[] {
  if (!text) return []
  
  const mentionRegex = /@([a-zA-Z0-9_]+)/g
  const matches = text.matchAll(mentionRegex)
  const usernames = Array.from(matches, m => m[1])
  
  // Убираем дубликаты
  return [...new Set(usernames)]
}

/**
 * Отправляет уведомления об упоминаниях
 * Вызывается после создания поста или комментария
 */
export async function notifyMentions(params: {
  content: string
  postId: string
  mentionerId: string
  mentionType: 'post' | 'comment'
}): Promise<void> {
  const { content, postId, mentionerId, mentionType } = params
  
  // Находим упоминания
  const mentions = parseMentions(content)
  
  if (mentions.length === 0) {
    return
  }
  
  try {
    const supabase = createClient()
    
    // Вызываем RPC функцию для создания уведомлений
    const { error } = await supabase.rpc('notify_mentions', {
      content_text: content,
      post_id_param: postId,
      mentioner_id: mentionerId,
      mention_type: mentionType
    })
    
    if (error) {
      console.error('[Mentions] Error creating notifications:', error)
    }
  } catch (error) {
    console.error('[Mentions] Failed to notify:', error)
  }
}

/**
 * Подсвечивает упоминания @username в тексте
 * Используется в preview комментариев и постов
 */
export function highlightMentions(text: string): string {
  if (!text) return ''
  
  return text.replace(
    /@([a-zA-Z0-9_]+)/g,
    '<a href="/profile/$1" class="text-primary hover:underline">@$1</a>'
  )
}

/**
 * Получает список всех пользователей для автодополнения
 * При вводе @ показывает список
 */
export async function searchUsersForMention(query: string, limit: number = 5) {
  if (!query || query.length < 2) return []
  
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(limit)
    
    if (error) {
      console.error('[Mentions] Search error:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('[Mentions] Search failed:', error)
    return []
  }
}

/**
 * Компонент для использования в React
 * Пример использования:
 * 
 * <MentionableTextarea
 *   value={content}
 *   onChange={setContent}
 *   placeholder="Напишите комментарий... (используйте @ для упоминания)"
 * />
 */
export interface MentionSuggestion {
  username: string
  display_name: string | null
  avatar_url?: string | null
}

/**
 * Проверяет валиден ли username для упоминания
 */
export function isValidMentionUsername(username: string): boolean {
  // Username должен быть 3-20 символов, только буквы, цифры и underscore
  return /^[a-zA-Z0-9_]{3,20}$/.test(username)
}

/**
 * Конвертирует Markdown с упоминаниями в HTML
 */
export function markdownWithMentions(markdown: string): string {
  if (!markdown) return ''
  
  // Сначала обрабатываем упоминания, потом остальной Markdown
  let processed = markdown.replace(
    /@([a-zA-Z0-9_]+)/g,
    (match, username) => {
      if (isValidMentionUsername(username)) {
        return `[@${username}](/profile/${username})`
      }
      return match
    }
  )
  
  return processed
}
