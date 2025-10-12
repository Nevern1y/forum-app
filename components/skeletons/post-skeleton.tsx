import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PostSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex items-center gap-6 mt-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

export function PostSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  )
}
