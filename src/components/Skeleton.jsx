export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-zinc-800 rounded ${className}`} />
}

export function CalendarSkeleton() {
  return (
    <div className="p-4 space-y-4 bg-zinc-950 min-h-full">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  )
}
