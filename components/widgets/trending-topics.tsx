import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { TrendingUp, Hash } from "lucide-react"

export async function TrendingTopics() {
  const supabase = await createClient()

  // Get tags with post count from the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: trendingTags } = await supabase
    .from("tags")
    .select(`
      id,
      name,
      post_tags!inner (
        post_id,
        posts!inner (
          created_at
        )
      )
    `)
    .gte("post_tags.posts.created_at", sevenDaysAgo.toISOString())
    .limit(10)

  // Count posts per tag and sort
  const tagCounts = trendingTags?.reduce((acc: Record<string, { name: string; count: number }>, tag) => {
    const count = tag.post_tags?.length || 0
    if (!acc[tag.id]) {
      acc[tag.id] = { name: tag.name, count: 0 }
    }
    acc[tag.id].count += count
    return acc
  }, {})

  const sortedTags = Object.values(tagCounts || {})
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Тренды недели
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedTags.length > 0 ? (
          <div className="space-y-3">
            {sortedTags.map((tag, index) => (
              <Link
                key={tag.name}
                href={`/search?q=${encodeURIComponent(tag.name)}&type=posts`}
                className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium group-hover:underline">{tag.name}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="tabular-nums">
                  {tag.count} {tag.count === 1 ? 'пост' : 'постов'}
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Пока нет трендовых тем
          </p>
        )}
      </CardContent>
    </Card>
  )
}
