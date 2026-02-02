import { Skeleton } from "@/components/ui/skeleton"

type PageSkeletonProps = {
  type: "tournament" | "shop" | "profile" | "dashboard" | "participants" | "matches" | "brackets" | "chat"
  count?: number
}

export function PageSkeleton({ type, count = 1 }: PageSkeletonProps) {
  const renderTournamentSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array(count)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-xl" />
          ))}
      </div>
    </div>
  )

  const renderShopSkeleton = () => (
    <div className="space-y-6">
      <Skeleton className="h-8 w-[150px]" />
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {Array(count)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-[250px] rounded-xl" />
          ))}
      </div>
    </div>
  )

  const renderProfileSkeleton = () => (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )

  const renderDashboardSkeleton = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-lg" />
          ))}
      </div>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  )

  const renderParticipantsSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-[200px]" />
      <Skeleton className="h-4 w-full" />
      <div className="space-y-4">
        {Array(count)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
              </div>
              <Skeleton className="h-6 w-[80px] rounded-full" />
            </div>
          ))}
      </div>
    </div>
  )

  const renderMatchesSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-[150px]" />
      <div className="space-y-4">
        {Array(count)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
                <Skeleton className="h-6 w-[60px]" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )

  const renderBracketsSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-[150px]" />
      <div className="h-[400px] rounded-lg bg-muted/30 flex items-center justify-center">
        <Skeleton className="h-[350px] w-[90%] rounded-lg" />
      </div>
    </div>
  )

  const renderChatSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-[150px]" />
      <div className="h-[500px] rounded-lg border">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-[150px]" />
        </div>
        <div className="p-4 space-y-4 h-[400px]">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}>
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className={`rounded-lg px-3 py-2 max-w-[80%] ${i % 2 === 0 ? "bg-muted" : "bg-primary"}`}>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-[80px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              </div>
            ))}
        </div>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )

  const skeletonMap = {
    tournament: renderTournamentSkeleton,
    shop: renderShopSkeleton,
    profile: renderProfileSkeleton,
    dashboard: renderDashboardSkeleton,
    participants: renderParticipantsSkeleton,
    matches: renderMatchesSkeleton,
    brackets: renderBracketsSkeleton,
    chat: renderChatSkeleton,
  }

  return <div className="container py-6">{skeletonMap[type]()}</div>
}
