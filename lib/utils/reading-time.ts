/**
 * Calculate reading time for a given text
 * @param text - The text to calculate reading time for
 * @param wordsPerMinute - Average reading speed (default: 200 words per minute)
 * @returns Reading time in minutes
 */
export function calculateReadingTime(text: string, wordsPerMinute: number = 200): number {
  // Remove markdown syntax for accurate word count
  const plainText = text
    .replace(/[#*_~`>\[\]()]/g, '') // Remove markdown characters
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image syntax
    .replace(/\[.*?\]\(.*?\)/g, '') // Remove link syntax
    .trim()

  // Count words (split by whitespace and filter empty strings)
  const words = plainText.split(/\s+/).filter(word => word.length > 0)
  const wordCount = words.length

  // Calculate reading time in minutes (minimum 1 minute)
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute))

  return minutes
}

/**
 * Format reading time as a human-readable string
 * @param minutes - Reading time in minutes
 * @returns Formatted string
 */
export function formatReadingTime(minutes: number): string {
  if (minutes === 1) {
    return '1 мин чтения'
  }
  if (minutes < 5) {
    return `${minutes} мин чтения`
  }
  if (minutes < 60) {
    return `${minutes} мин чтения`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours} ч чтения`
  }
  
  return `${hours} ч ${remainingMinutes} мин чтения`
}
