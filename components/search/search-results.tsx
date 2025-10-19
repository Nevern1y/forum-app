import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { FileText, MessageSquare, Users } from "lucide-react"

interface SearchResultsProps {
  query: string
  searchType: string
}

export async function SearchResults({ query, searchType }: SearchResultsProps) {
  const supabase = await createClient()

  if (searchType === "posts") {
    const { data: posts } = await supabase
      .from("posts")
      .select(`
        *,
        profiles:author_id (username, display_name, avatar_url),
        post_tags (
          tags (name)
        )
      `)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20)

    if (!posts || posts.length === 0) {
      return (
        <Card className="border-dashed dark:bg-[#181818]">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="rounded-full bg-muted p-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Посты не найдены</p>
                <p className="text-sm text-muted-foreground">
                  Попробуйте изменить поисковый запрос
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 px-1">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <p className="text-sm font-medium text-muted-foreground">Найдено постов: {posts.length}</p>
        </div>
        {posts.map((post) => {
          const profile = post.profiles
          const tags = post.post_tags.map((pt: { tags: { name: string } | null }) => pt.tags?.name).filter(Boolean)

          return (
            <Card key={post.id} className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden dark:bg-[#181818]">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <CardHeader className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-9 w-9 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {profile?.display_name?.[0]?.toUpperCase() || profile?.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 text-sm">
                    <Link href={`/profile/${profile?.username}`} className="font-semibold hover:text-primary transition-colors">
                      {profile?.display_name || profile?.username}
                    </Link>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="text-muted-foreground/70 text-xs">
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </span>
                  </div>
                </div>
                <Link href={`/post/${post.id}`} className="text-xl font-bold hover:text-primary transition-colors leading-tight">
                  {post.title}
                </Link>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs font-medium hover:bg-primary/10 transition-colors">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="relative">
                <p className="line-clamp-2 text-muted-foreground/80 text-[15px] leading-relaxed">
                  {post.content.substring(0, 200)}{post.content.length > 200 ? '...' : ''}
                </p>
                <div className="mt-4 flex items-center gap-5 text-sm text-muted-foreground/60">
                  <span className="flex items-center gap-1.5">
                    <span className="text-foreground/70 font-medium">{post.views}</span> просмотров
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-foreground/70 font-medium">{post.likes}</span> лайков
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  if (searchType === "comments") {
    const { data: comments } = await supabase
      .from("comments")
      .select(`
        *,
        profiles:author_id (username, display_name, avatar_url),
        posts:post_id (id, title)
      `)
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20)

    if (!comments || comments.length === 0) {
      return (
        <Card className="border-dashed dark:bg-[#181818]">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="rounded-full bg-muted p-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Комментарии не найдены</p>
                <p className="text-sm text-muted-foreground">
                  Попробуйте изменить поисковый запрос
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Найдено комментариев: {comments.length}</p>
        {comments.map((comment) => {
          const profile = comment.profiles
          const post = comment.posts

          return (
            <Card key={comment.id} className="dark:bg-[#181818]">
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link href={`/profile/${profile?.username}`} className="font-medium hover:underline">
                    {profile?.display_name || profile?.username}
                  </Link>
                  <span>прокомментировал</span>
                  <Link href={`/post/${post?.id}`} className="font-medium hover:underline">
                    {post?.title}
                  </Link>
                </div>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{comment.content}</p>
                <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                  <span>{comment.likes} лайков</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  if (searchType === "users") {
    const { data: users } = await supabase
      .from("profiles")
      .select("*")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .order("reputation", { ascending: false })
      .limit(20)

    if (!users || users.length === 0) {
      return (
        <Card className="border-dashed dark:bg-[#181818]">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="rounded-full bg-muted p-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Пользователи не найдены</p>
                <p className="text-sm text-muted-foreground">
                  Попробуйте изменить поисковый запрос
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 px-1">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <p className="text-sm font-medium text-muted-foreground">Найдено пользователей: {users.length}</p>
        </div>
        {users.map((user) => (
          <Link key={user.id} href={`/profile/${user.username}`}>
            <Card className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300 dark:bg-[#181818]">
              <CardContent className="pt-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Avatar className="relative h-16 w-16 ring-2 ring-border group-hover:ring-primary/40 transition-all">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary/10 to-primary/5">
                        {user.display_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors truncate">
                      {user.display_name || user.username}
                    </h3>
                    <p className="text-sm text-muted-foreground/70">@{user.username}</p>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground/80 mt-2 line-clamp-2 leading-relaxed">
                        {user.bio}
                      </p>
                    )}
                    {user.reputation > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-amber-500">⭐</span>
                        <span className="text-sm font-medium text-foreground/80">
                          {user.reputation} репутации
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    )
  }

  return null
}
