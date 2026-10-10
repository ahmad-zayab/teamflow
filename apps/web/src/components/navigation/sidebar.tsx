'use client';

import React from 'react';

export function Sidebar({ currentOrg }: { currentOrg: string }) {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-indigo-400">TeamFlow</h2>
        <span className="rounded bg-indigo-950 px-2 py-0.5 text-xs text-indigo-300">{currentOrg}</span>
      </div>
      <nav className="space-y-1">
        <button className="w-full rounded-md bg-indigo-600/20 px-3 py-2 text-left text-sm font-medium text-indigo-300">
          Kanban Board
        </button>
        <button className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-400 hover:bg-slate-800">
          Backlog
        </button>
        <button className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-400 hover:bg-slate-800">
          Settings
        </button>
      </nav>
    </aside>
  );
}
