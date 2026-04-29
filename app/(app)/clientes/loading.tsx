export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="h-7 bg-muted rounded-lg w-24" />
        <div className="h-9 bg-muted rounded-xl w-32" />
      </div>
      <div className="h-10 bg-muted rounded-xl w-full sm:w-80 mb-4" />
      <div className="flex gap-2 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-muted rounded-full w-20" />
        ))}
      </div>
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="h-10 bg-muted/50 border-b border-border" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-t border-border">
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-40 mb-1" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
            <div className="h-3 bg-muted rounded w-24 hidden sm:block" />
            <div className="h-3 bg-muted rounded w-28 hidden sm:block" />
            <div className="h-5 bg-muted rounded-full w-20 hidden sm:block" />
            <div className="h-3 bg-muted rounded w-20 hidden sm:block" />
            <div className="h-4 bg-muted rounded w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
