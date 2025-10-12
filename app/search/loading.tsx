export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 via-background to-background dark:bg-background">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-3 pt-6 pb-4">
            <div className="h-10 w-40 bg-muted/50 rounded-lg shimmer mx-auto" />
            <div className="h-5 w-72 bg-muted/40 rounded shimmer mx-auto" />
          </div>

          {/* Search Form Card */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg p-6">
            <div className="space-y-5">
              {/* Search input */}
              <div className="h-12 w-full bg-muted/50 rounded-xl shimmer" />
              
              {/* Tabs */}
              <div className="grid grid-cols-3 gap-2 h-11 bg-muted/50 p-1 rounded-xl">
                <div className="bg-muted/60 rounded-lg shimmer" />
                <div className="bg-muted/40 rounded-lg shimmer" />
                <div className="bg-muted/40 rounded-lg shimmer" />
              </div>
            </div>
          </div>

          {/* Results skeleton */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 px-1">
              <div className="h-1 w-1 rounded-full bg-primary shimmer" />
              <div className="h-4 w-36 bg-muted/50 rounded shimmer" />
            </div>
            
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-4 shimmer">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted/50 shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted/50 rounded shimmer" />
                    <div className="h-3 w-24 bg-muted/40 rounded shimmer" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-3/4 bg-muted/50 rounded shimmer" />
                  <div className="h-4 w-full bg-muted/40 rounded shimmer" />
                  <div className="h-4 w-5/6 bg-muted/40 rounded shimmer" />
                </div>
                <div className="flex gap-4">
                  <div className="h-4 w-24 bg-muted/40 rounded shimmer" />
                  <div className="h-4 w-20 bg-muted/40 rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
