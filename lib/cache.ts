/**
 * Система кэширования для оптимизации производительности
 */

// In-memory кэш для клиентской стороны
const clientCache = new Map<string, { data: any; timestamp: number }>()

// Время жизни кэша по умолчанию (5 минут)
const DEFAULT_TTL = 5 * 60 * 1000

/**
 * Получить данные из кэша
 */
export function getCached<T>(key: string): T | null {
  const cached = clientCache.get(key)
  
  if (!cached) return null
  
  // Проверяем, не истек ли срок
  if (Date.now() - cached.timestamp > DEFAULT_TTL) {
    clientCache.delete(key)
    return null
  }
  
  return cached.data as T
}

/**
 * Сохранить данные в кэш
 */
export function setCached<T>(key: string, data: T): void {
  clientCache.set(key, {
    data,
    timestamp: Date.now(),
  })
}

/**
 * Очистить конкретный ключ из кэша
 */
export function clearCached(key: string): void {
  clientCache.delete(key)
}

/**
 * Очистить весь кэш
 */
export function clearAllCache(): void {
  clientCache.clear()
}

/**
 * Получить данные с кэшированием
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // Проверяем кэш
  const cached = getCached<T>(key)
  if (cached !== null) {
    return cached
  }
  
  // Загружаем данные
  const data = await fetcher()
  
  // Сохраняем в кэш
  setCached(key, data)
  
  return data
}

/**
 * React Query style - автоматическое кэширование
 */
export function createCachedFetcher<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  ttl?: number
) {
  return () => withCache(cacheKey, fetcher, ttl)
}
