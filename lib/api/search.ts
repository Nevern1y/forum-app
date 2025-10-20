/**
 * Search API with Context7 Best Practices
 * Full-Text Search with filters
 * - Explicit filters for better query plans
 * - Limited columns selection
 * - Safe pagination
 * - Optimized fallback queries
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
 * Context7 Optimization: Safe pagination + proper fallback
 */
export async function searchPosts(filters: SearchFilters): Promise<SearchResult[]> {
  const supabase = createClient()
  
  // Context7: Safe pagination
  const safePageSize = Math.min(filters.pageSize || 20, 100)
  const safePageOffset = Math.max(filters.pageOffset || 0, 0)
  
  console.log('[Search] Calling search_posts with:', {
    search_query: filters.query || '',
    sort_by: filters.sortBy || 'relevance',
    page_size: safePageSize,
  })
  
  const { data, error } = await supabase.rpc('search_posts', {
    search_query: filters.query || '',
    tag_filter: filters.tag || null,
    author_filter: filters.authorId || null,
    date_from: filters.dateFrom || null,
    date_to: filters.dateTo || null,
    sort_by: filters.sortBy || 'relevance',
    page_size: safePageSize,      // Context7: Safe limit
    page_offset: safePageOffset   // Context7: Safe offset
  })
  
  if (error) {
    console.error('[Search] RPC Error:', error)
    console.error('[Search] Error details:', JSON.stringify(error, null, 2))
    
    // Context7 Fallback: Simple query with explicit filters
    console.log('[Search] Trying fallback search...')
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        author_id,
        views,
        created_at,
        profiles:author_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .ilike('title', `%${filters.query}%`) // Explicit filter
      .limit(safePageSize)                    // Context7: Safe limit
      .order('created_at', { ascending: false })
    
    if (fallbackError) {
      console.error('[Search] Fallback error:', fallbackError)
      return []
    }
    
    console.log('[Search] Fallback returned:', fallbackData?.length, 'results')
    
    // Transform fallback data
    return (fallbackData || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content.substring(0, 300),
      author_id: post.author_id,
      views: post.views || 0,
      likes: 0,
      dislikes: 0,
      comment_count: 0,
      created_at: post.created_at,
      author_username: post.profiles?.username || 'unknown',
      author_display_name: post.profiles?.display_name || null,
      author_avatar_url: post.profiles?.avatar_url || null,
      tags: [],
      rank: 1
    }))
  }
  
  console.log('[Search] RPC returned:', data?.length, 'results')
  return data as SearchResult[]
}

/**
 * Search users (for autocomplete)
 * Context7 Optimization: Safe limits
 */
export async function searchUsers(query: string, limit = 10): Promise<UserSearchResult[]> {
  const supabase = createClient()
  
  // Context7: Safe limit for autocomplete
  const safeLimit = Math.min(limit, 50)
  
  const { data, error } = await supabase.rpc('search_users', {
    search_query: query,
    result_limit: safeLimit // Context7: Safe limit
  })
  
  if (error) {
    console.error('[Search] Error searching users:', error)
    throw new Error(error.message)
  }
  
  return data as UserSearchResult[]
}

/**
 * Get autocomplete suggestions
 * Context7 Optimization: Safe limits
 */
export async function getSearchSuggestions(prefix: string, limit = 5): Promise<SearchSuggestion[]> {
  const supabase = createClient()
  
  // Context7: Safe limit for suggestions
  const safeLimit = Math.min(limit, 20)
  
  const { data, error } = await supabase.rpc('get_search_suggestions', {
    search_prefix: prefix,
    result_limit: safeLimit // Context7: Safe limit
  })
  
  if (error) {
    console.error('[Search] Error getting suggestions:', error)
    return []
  }
  
  return data as SearchSuggestion[]
}

/**
 * Get popular tags (for filter dropdown)
 * Context7 Optimization: Explicit filters + safe limits
 */
export async function getPopularTags(limit = 20) {
  const supabase = createClient()
  
  // Context7: Safe limit
  const safeLimit = Math.min(limit, 100)
  
  // Context7: Select specific columns + safe limit
  const { data, error } = await supabase
    .from('tags')
    .select(`
      id,
      name,
      post_tags (count)
    `)
    .order('post_tags.count', { ascending: false })
    .limit(safeLimit) // Context7: Safe limit
  
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
