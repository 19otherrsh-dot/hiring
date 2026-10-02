import React from 'react';

export function SkeletonLine({ width = '100%', height = '14px' }: { width?: string; height?: string }) {
  return <div className="skeleton-line" style={{ width, height }} />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <SkeletonLine width="60%" height="18px" />
      <SkeletonLine width="40%" />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <SkeletonLine width="60px" height="22px" />
        <SkeletonLine width="80px" height="22px" />
        <SkeletonLine width="50px" height="22px" />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="stat-card">
      <div className="skeleton-circle" style={{ width: 48, height: 48 }} />
      <div style={{ flex: 1 }}>
        <SkeletonLine width="50px" height="28px" />
        <SkeletonLine width="80px" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <SkeletonLine width="100%" height="12px" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 16 }}>
          <SkeletonLine width="30%" />
          <SkeletonLine width="20%" />
          <SkeletonLine width="15%" />
          <SkeletonLine width="15%" />
        </div>
      ))}
    </div>
  );
}
