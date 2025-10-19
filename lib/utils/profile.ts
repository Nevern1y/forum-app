/**
 * Утилиты для работы с профилями пользователей
 */

/**
 * Создаёт безопасную ссылку на профиль пользователя
 * Возвращает null если username недоступен
 */
export function getProfileLink(username?: string | null): string | null {
  if (!username || username.trim() === '') {
    return null
  }
  
  // Кодируем username для безопасности URL
  const encoded = encodeURIComponent(username.trim())
  return `/profile/${encoded}`
}

/**
 * Безопасный компонент ссылки на профиль
 * Использовать так: {getSafeProfileLink(username, children) ?? <span>{children}</span>}
 */
export function getSafeProfileLink(
  username?: string | null,
  children?: React.ReactNode
): React.ReactElement | null {
  const link = getProfileLink(username)
  
  if (!link) {
    return null
  }
  
  return link
}

/**
 * Проверяет валидность username
 */
export function isValidUsername(username?: string | null): boolean {
  if (!username || typeof username !== 'string') {
    return false
  }
  
  const trimmed = username.trim()
  
  // Username должен быть от 3 до 30 символов
  if (trimmed.length < 3 || trimmed.length > 30) {
    return false
  }
  
  // Разрешены только буквы, цифры, дефис и подчёркивание
  const usernameRegex = /^[a-zA-Z0-9_-]+$/
  return usernameRegex.test(trimmed)
}
