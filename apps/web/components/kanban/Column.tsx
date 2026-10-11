"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Column as ColumnType } from "@/types/kanban";
import { TaskCard } from "./TaskCard";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo } from "react";
import { MoreHorizontal, Plus } from "lucide-react";

interface ColumnProps {
  column: ColumnType;
}

export function Column({ column }: ColumnProps) {
  const taskIds = useMemo(() => column.tasks.map((t) => t.id), [column.tasks]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-gray-100 dark:bg-gray-800/50 w-80 shrink-0 rounded-lg border-2 border-blue-500 opacity-40 flex flex-col h-full min-h-[500px]"
      ></div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-100 dark:bg-gray-800/50 w-80 shrink-0 rounded-lg flex flex-col h-full max-h-full"
    >
      {/* Column Header */}
      <div
        {...attributes}
        {...listeners}
        className="p-3 font-semibold flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{column.name}</h3>
          <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
        </div>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Column Tasks */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
      
      {/* Add Task Footer */}
      <div className="p-2 pt-0 mt-auto">
        <button className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 w-full p-2 rounded-md transition-colors">
          <Plus size={16} />
          Add a task
        </button>
      </div>
    </div>
  );
}
