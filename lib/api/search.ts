/**
 * Search API
 * Full-Text Search with filters
 */

import { createClient } from '@/lib/supabase/client'

export interface SearchFilters {
  query: string
  tag?: string
  authorId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'relevance' | 'recent' | 'popular'
  pageSize?: number
  pageOffset?: number
}

export interface SearchResult {
  id: string
  title: string
  content: string // Preview (300 chars)
  author_id: string
  views: number
  likes: number
  dislikes: number
  comment_count: number
  created_at: string
  author_username: string
  author_display_name: string | null
  author_avatar_url: string | null
  tags: string[]
  rank: number
}

export interface UserSearchResult {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  reputation: number
}

export interface SearchSuggestion {
  suggestion: string
  type: 'post_title' | 'tag' | 'username'
  count: number
}

/**
 * Search posts with filters
 */
export async function searchPosts(filters: SearchFilters): Promise<SearchResult[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('search_posts', {
    search_query: filters.query || '',
    tag_filter: filters.tag || null,
    author_filter: filters.authorId || null,
    date_from: filters.dateFrom || null,
    date_to: filters.dateTo || null,
    sort_by: filters.sortBy || 'relevance',
    page_size: filters.pageSize || 20,
    page_offset: filters.pageOffset || 0
  })
  
  if (error) {
    console.error('[Search] Error searching posts:', error)
    throw new Error(error.message)
  }
  
  return data as SearchResult[]
}

/**
 * Search users (for autocomplete)
 */
export async function searchUsers(query: string, limit = 10): Promise<UserSearchResult[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('search_users', {
    search_query: query,
    result_limit: limit
  })
  
  if (error) {
    console.error('[Search] Error searching users:', error)
    throw new Error(error.message)
  }
  
  return data as UserSearchResult[]
}

/**
 * Get autocomplete suggestions
 */
export async function getSearchSuggestions(prefix: string, limit = 5): Promise<SearchSuggestion[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('get_search_suggestions', {
    search_prefix: prefix,
    result_limit: limit
  })
  
  if (error) {
    console.error('[Search] Error getting suggestions:', error)
    return []
  }
  
  return data as SearchSuggestion[]
}

/**
 * Get popular tags (for filter dropdown)
 */
export async function getPopularTags(limit = 20) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tags')
    .select(`
      id,
      name,
      post_tags (count)
    `)
    .order('post_tags.count', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('[Search] Error getting popular tags:', error)
    return []
  }
  
  return data
}

/**
 * Save search query to history (localStorage)
 */
export function saveSearchHistory(query: string) {
  if (typeof window === 'undefined' || !query.trim()) return
  
  try {
    const history = getSearchHistory()
    const updated = [query, ...history.filter(q => q !== query)].slice(0, 10)
    localStorage.setItem('search_history', JSON.stringify(updated))
  } catch (error) {
    console.error('[Search] Error saving history:', error)
  }
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const history = localStorage.getItem('search_history')
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.error('[Search] Error getting history:', error)
    return []
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('search_history')
  } catch (error) {
    console.error('[Search] Error clearing history:', error)
  }
}
