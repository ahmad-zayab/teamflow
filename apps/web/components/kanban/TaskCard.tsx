"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/kanban";
import { GripVertical } from "lucide-react";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50 border-2 border-blue-500 rounded-md h-24 bg-blue-50 dark:bg-blue-900/20"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group flex items-start"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-1 mr-2 cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={16} />
      </button>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</h4>
        {task.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {task.description}
          </p>
        )}
      </div>
    </div>
  );
}
