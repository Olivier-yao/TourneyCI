"use client";

export function Skeleton({
  className = "",
  height = 16,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        height,
        background: "var(--ds-surface-2)",
        borderRadius: "var(--ds-radius-sm)",
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      className="flex flex-col gap-2 p-4"
      style={{ background: "var(--ds-surface)", borderRadius: "var(--ds-radius-lg)" }}
    >
      <Skeleton className="w-2/3" height={14} />
      <Skeleton className="w-1/3" height={12} />
      <Skeleton className="w-full" height={40} />
    </div>
  );
}
