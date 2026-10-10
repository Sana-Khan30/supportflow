export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton rounded-control ${className}`} />
);

// Mirrors the real ticket card: edge stripe + two text lines + badge placeholders
export const TicketCardSkeleton = () => (
  <div className="flex bg-white border border-ink-100 rounded-card overflow-hidden">
    <div className="w-[2px] shrink-0 bg-ink-100" />
    <div className="flex-1 px-5 py-4">
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="flex gap-2 shrink-0">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
    </div>
  </div>
);

// Mirrors the ticket detail overview card
export const TicketDetailSkeleton = () => (
  <div className="space-y-4">
    <div className="flex bg-white border border-ink-100 rounded-card overflow-hidden">
      <div className="w-[2px] shrink-0 bg-ink-100" />
      <div className="flex-1 p-6 space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
    <div className="bg-white border border-ink-100 rounded-card p-6 space-y-2">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-16 w-full" />
    </div>
  </div>
);

export default Skeleton;
