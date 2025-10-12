import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ProfileSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full max-w-xs" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
