'use client';

import React, { useState } from 'react';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const columns = ['TODO', 'IN_PROGRESS', 'DONE'] as const;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {columns.map((col) => (
        <div key={col} className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="mb-4 text-xs font-semibold tracking-wider text-slate-400 uppercase">{col}</h3>
          <div className="space-y-3">
            {tasks.filter((t) => t.status === col).map((task) => (
              <div key={task.id} className="cursor-grab rounded-md border border-slate-700 bg-slate-800/80 p-3 shadow-sm hover:border-slate-500">
                <p className="text-sm font-medium text-slate-200">{task.title}</p>
                <span className="mt-2 inline-block rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">{task.priority}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
