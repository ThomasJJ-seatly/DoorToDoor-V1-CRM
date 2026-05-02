export function CardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-4 bg-bg-secondary rounded w-1/3 mb-3" />
      <div className="h-8 bg-bg-secondary rounded w-1/2 mb-2" />
      <div className="h-3 bg-bg-secondary rounded w-1/4" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-border-subtle">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 bg-bg-secondary rounded animate-pulse"
            style={{ width: `${60 + (i % 3) * 20}%` }}
          />
        </td>
      ))}
    </tr>
  )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="h-4 bg-bg-secondary rounded w-2/3 mb-2" />
          <div className="h-3 bg-bg-secondary rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}
