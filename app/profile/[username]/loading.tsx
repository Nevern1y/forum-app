export default function ProfileLoading() {
  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-6">
      <div className="relative animate-fade-in">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 -top-20 bg-gradient-to-b from-primary/5 via-primary/2 to-transparent rounded-3xl blur-3xl -z-10 dark:opacity-0" />
        
        <div className="pb-6 pt-4">
          {/* Avatar Section - Centered */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="h-[120px] w-[120px] rounded-full bg-muted/50 shimmer" />
            </div>

            {/* Name and Username */}
            <div className="text-center mt-5 space-y-2">
              <div className="h-8 w-48 bg-muted/50 rounded-lg shimmer mx-auto" />
              <div className="h-5 w-32 bg-muted/40 rounded-md shimmer mx-auto" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4">
              <div className="h-10 w-40 bg-muted/50 rounded-full shimmer" />
              <div className="h-10 w-10 bg-muted/50 rounded-full shimmer" />
            </div>
          </div>

          {/* Bio */}
          <div className="text-center max-w-2xl mx-auto mb-5 space-y-2">
            <div className="h-4 w-full bg-muted/40 rounded shimmer" />
            <div className="h-4 w-3/4 bg-muted/40 rounded shimmer mx-auto" />
          </div>

          {/* Location & Website */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-4 w-24 bg-muted/40 rounded shimmer" />
            <div className="h-4 w-32 bg-muted/40 rounded shimmer" />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 py-4 px-6 bg-muted/30 rounded-2xl">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-7 w-12 bg-muted/50 rounded shimmer mx-auto" />
                <div className="h-3 w-16 bg-muted/40 rounded shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* Border */}
        <div className="relative mt-6">
          <div className="border-b" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="mt-0">
        <div className="flex gap-8 border-b pb-3 pt-4">
          <div className="h-5 w-16 bg-muted/50 rounded shimmer" />
          <div className="h-5 w-20 bg-muted/40 rounded shimmer" />
        </div>
        
        {/* Posts skeleton */}
        <div className="mt-6 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted/50 shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted/50 rounded shimmer" />
                  <div className="h-3 w-24 bg-muted/40 rounded shimmer" />
                </div>
              </div>
              <div className="space-y-2 pl-12">
                <div className="h-4 w-full bg-muted/40 rounded shimmer" />
                <div className="h-4 w-5/6 bg-muted/40 rounded shimmer" />
                <div className="h-4 w-4/6 bg-muted/40 rounded shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
