"use client"

import { useEffect, useState } from "react"
import { getFollowingFeed } from "@/lib/api/subscriptions"
import { PostCard } from "./post-card"
import { Loader2, UserPlus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Post } from "@/lib/types"

export function FollowingFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFeed()
  }, [])

  const loadFeed = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await getFollowingFeed(20, 0)

      // Transform RPC data to Post format
      const transformedPosts: Post[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        author_id: item.author_id,
        views: item.views,
        likes: item.likes,
        dislikes: item.dislikes,
        comment_count: item.comment_count,
        is_pinned: item.is_pinned,
        media_urls: null,
        audio_url: null,
        created_at: item.created_at,
        updated_at: item.updated_at,
        profiles: {
          id: item.author_id,
          username: item.author_username,
          display_name: item.author_display_name,
          avatar_url: item.author_avatar_url,
          reputation: item.author_reputation,
          created_at: "",
          updated_at: ""
        },
        post_tags: [],
        user_reaction: item.user_reaction
      }))

      setPosts(transformedPosts)
    } catch (err) {
      console.error("[FollowingFeed] Error loading feed:", err)
      setError(err instanceof Error ? err.message : "Ошибка загрузки")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Загрузка ленты...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">Ошибка: {error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadFeed}
          className="mt-4"
        >
          Попробовать снова
        </Button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-12 text-center">
        <div className="mx-auto max-w-md space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Users className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Ваша лента пуста</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Подпишитесь на интересных авторов, чтобы видеть их посты здесь.
              Персонализированная лента поможет не пропустить важное!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild className="gap-2">
              <Link href="/feed">
                <UserPlus className="h-4 w-4" />
                Найти авторов
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/leaderboard">
                Топ авторов
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {posts.length >= 20 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            Загрузка новых постов скоро появится...
          </p>
        </div>
      )}
    </div>
  )
}
