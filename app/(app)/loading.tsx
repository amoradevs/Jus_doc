export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="h-3 bg-muted rounded w-32 mb-2" />
          <div className="h-7 bg-muted rounded w-40" />
        </div>
        <div className="h-9 bg-muted rounded-xl w-32" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-5">
            <div className="h-4 w-4 bg-muted rounded mb-3" />
            <div className="h-8 bg-muted rounded w-12 mb-1.5" />
            <div className="h-3 bg-muted rounded w-20" />
          </div>
        ))}
      </div>

      <div className="h-3 bg-muted rounded w-32 mb-4" />
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex items-center gap-4 px-5 py-4${i !== 0 ? ' border-t border-border' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-44 mb-1.5" />
              <div className="h-3 bg-muted rounded w-32" />
            </div>
            <div className="h-5 bg-muted rounded-full w-20 hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
