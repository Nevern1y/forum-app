/**
 * Subscriptions API
 * Follow/Unfollow functionality
 */

import { createClient } from '@/lib/supabase/client'

export interface FollowResult {
  action: 'followed' | 'unfollowed'
  following: boolean
  target_user_id: string
}

export interface FollowStats {
  user_id: string
  followers: number
  following: number
}

/**
 * Toggle follow/unfollow for a user
 */
export async function toggleFollow(targetUserId: string): Promise<FollowResult> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('toggle_follow', { target_user_id: targetUserId })
  
  if (error) {
    console.error('[Subscriptions] Toggle follow error:', error)
    throw new Error(error.message)
  }
  
  return data as FollowResult
}

/**
 * Check if current user follows target user
 */
export async function checkIfFollowing(targetUserId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle()
  
  if (error) {
    console.error('[Subscriptions] Check following error:', error)
    return false
  }
  
  return !!data
}

/**
 * Get follower/following stats for a user
 */
export async function getUserFollowStats(userId: string): Promise<FollowStats> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('get_user_follow_stats', { user_id: userId })
  
  if (error) {
    console.error('[Subscriptions] Get stats error:', error)
    throw new Error(error.message)
  }
  
  return data as FollowStats
}

/**
 * Get list of followers for a user
 */
export async function getFollowers(userId: string, limit = 50) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      id,
      created_at,
      follower:profiles!follower_id (
        id,
        username,
        display_name,
        avatar_url,
        reputation
      )
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('[Subscriptions] Get followers error:', error)
    throw new Error(error.message)
  }
  
  return data
}

/**
 * Get list of users that the user is following
 */
export async function getFollowing(userId: string, limit = 50) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      id,
      created_at,
      following:profiles!following_id (
        id,
        username,
        display_name,
        avatar_url,
        reputation
      )
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('[Subscriptions] Get following error:', error)
    throw new Error(error.message)
  }
  
  return data
}

/**
 * Get personalized feed (posts from followed users)
 */
export async function getFollowingFeed(pageSize = 20, pageOffset = 0) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('get_following_feed', {
      page_size: pageSize,
      page_offset: pageOffset
    })
  
  if (error) {
    console.error('[Subscriptions] Get feed error:', error)
    throw new Error(error.message)
  }
  
  return data
}
