/**
 * Supabase Query Helpers with Context7 Best Practices
 * 
 * These helpers ensure optimal query performance by:
 * - Adding explicit filters (even when RLS exists)
 * - Selecting only needed columns
 * - Adding limits to prevent large datasets
 * - Proper error handling
 * 
 * @see https://supabase.com/docs/guides/database/postgres/row-level-security
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'

/**
 * Query builder type for type-safe queries
 */
export type QueryBuilder<T> = ReturnType<SupabaseClient<Database>['from']>

/**
 * Add explicit user filter to query
 * Context7 Best Practice: Always add explicit filters even with RLS
 * This helps PostgreSQL build better query plans
 */
export function addUserFilter<T>(
  query: any,
  userId: string,
  column: string = 'user_id'
) {
  return query.eq(column, userId)
}

/**
 * Add explicit filters for multi-user queries (OR conditions)
 * Optimizes queries like: user1_id OR user2_id
 */
export function addMultiUserFilter(
  query: any,
  userId: string,
  columns: string[]
) {
  if (columns.length === 0) return query
  
  const filters = columns.map(col => `${col}.eq.${userId}`)
  return query.or(filters.join(','))
}

/**
 * Select only specific columns (avoid SELECT *)
 * Context7 Best Practice: Only fetch needed data
 */
export function selectColumns<T>(
  query: any,
  columns: string[]
) {
  return query.select(columns.join(','))
}

/**
 * Add pagination with safe limits
 * Context7 Best Practice: Always use limits to prevent large datasets
 */
export function addPagination(
  query: any,
  page: number = 0,
  pageSize: number = 20,
  maxPageSize: number = 100
) {
  const safePageSize = Math.min(pageSize, maxPageSize)
  const from = page * safePageSize
  const to = from + safePageSize - 1
  
  return query.range(from, to)
}

/**
 * Add default ordering
 */
export function addOrdering(
  query: any,
  column: string = 'created_at',
  ascending: boolean = false
) {
  return query.order(column, { ascending })
}

/**
 * Execute query with error handling
 */
export async function executeQuery<T>(
  query: any,
  errorMessage: string = 'Query failed'
): Promise<T[]> {
  const { data, error } = await query
  
  if (error) {
    console.error(`[Query Error] ${errorMessage}:`, error)
    throw new Error(`${errorMessage}: ${error.message}`)
  }
  
  return (data as T[]) || []
}

/**
 * Execute single query with error handling
 */
export async function executeSingleQuery<T>(
  query: any,
  errorMessage: string = 'Query failed'
): Promise<T | null> {
  const { data, error } = await query.single()
  
  if (error) {
    console.error(`[Query Error] ${errorMessage}:`, error)
    throw new Error(`${errorMessage}: ${error.message}`)
  }
  
  return data as T | null
}

/**
 * Build optimized query for user-specific data
 * Example: Get user's posts
 */
export function buildUserQuery(
  supabase: SupabaseClient<Database>,
  table: string,
  userId: string,
  columns: string[],
  options?: {
    page?: number
    pageSize?: number
    orderBy?: string
    ascending?: boolean
  }
) {
  let query = supabase
    .from(table as any)
    .select(columns.join(','))
    .eq('user_id', userId) // Explicit filter!
  
  if (options?.orderBy) {
    query = addOrdering(query, options.orderBy, options.ascending)
  }
  
  if (options?.page !== undefined) {
    query = addPagination(query, options.page, options.pageSize)
  }
  
  return query
}

/**
 * Build optimized query for multi-user data (conversations, friendships)
 * Example: Get user's conversations
 */
export function buildMultiUserQuery(
  supabase: SupabaseClient<Database>,
  table: string,
  userId: string,
  userColumns: string[],
  columns: string[],
  options?: {
    page?: number
    pageSize?: number
    orderBy?: string
    ascending?: boolean
  }
) {
  let query = supabase
    .from(table as any)
    .select(columns.join(','))
  
  // Add explicit OR filter
  query = addMultiUserFilter(query, userId, userColumns)
  
  if (options?.orderBy) {
    query = addOrdering(query, options.orderBy, options.ascending)
  }
  
  if (options?.page !== undefined) {
    query = addPagination(query, options.page, options.pageSize)
  }
  
  return query
}

/**
 * Explain query for performance analysis (dev only)
 * Context7 Best Practice: Use .explain() to analyze query performance
 */
export async function explainQuery(query: any, analyze: boolean = true) {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('explainQuery should only be used in development')
    return null
  }
  
  try {
    const { data } = await query.explain({ analyze })
    console.log('[Query Explain]:', data)
    return data
  } catch (error) {
    console.error('[Explain Error]:', error)
    return null
  }
}
