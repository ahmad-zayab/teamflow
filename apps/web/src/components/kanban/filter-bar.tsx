'use client';

import React from 'react';

export function FilterBar({ onFilterChange }: { onFilterChange: (p: string) => void }) {
  return (
    <div className="mb-6 flex items-center space-x-3">
      <span className="text-xs text-slate-400">Filter by Priority:</span>
      {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
        <button
          key={p}
          onClick={() => onFilterChange(p)}
          className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-slate-500"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
