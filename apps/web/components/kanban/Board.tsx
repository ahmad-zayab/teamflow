"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent 
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Column, Task, Project } from "@/types/kanban";
import { Column as KanbanColumn } from "./Column";
import { TaskCard } from "./TaskCard";
import { api } from "@/lib/api";

interface BoardProps {
  project: Project;
}

export function Board({ project }: BoardProps) {
  const [columns, setColumns] = useState<Column[]>(project.columns);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Sync columns state when query cache updates in real-time (unless currently dragging)
  useEffect(() => {
    if (!activeTask && !activeColumn) {
      setColumns(project.columns);
    }
  }, [project.columns, activeTask, activeColumn]);

  const queryClient = useQueryClient();

  // Optimistic Mutation for Moving a Task
  const moveTaskMutation = useMutation({
    mutationFn: async (data: { taskId: string; newColumnId: string; newPosition: number }) => {
      await api.patch(`/tasks/${data.taskId}/move`, {
        newColumnId: data.newColumnId,
        newPosition: data.newPosition,
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["project", project.id] });
      const previousProject = queryClient.getQueryData(["project", project.id]);
      // The local UI is already updated via onDragEnd, we just save the previous state for rollback
      return { previousProject };
    },
    onError: (err, newTodo, context) => {
      // Rollback on failure
      queryClient.setQueryData(["project", project.id], context?.previousProject);
      // Revert local state as well
      if (context?.previousProject) {
        setColumns((context.previousProject as Project).columns);
      }
    },
    onSettled: () => {
      // Invalidate to fetch the true source of truth
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
    },
  });

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // 3px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }

    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    // Scenario 1: Dropping a Task over another Task
    if (isActiveTask && isOverTask) {
      setColumns((columns) => {
        const activeIndex = columns.findIndex((col) => col.tasks.some(t => t.id === activeId));
        const overIndex = columns.findIndex((col) => col.tasks.some(t => t.id === overId));

        const activeColumnIndex = activeIndex;
        const overColumnIndex = overIndex;

        if (activeColumnIndex !== overColumnIndex) {
          // Moving to a different column
          const newColumns = [...columns];
          const activeTaskIndex = newColumns[activeColumnIndex].tasks.findIndex(t => t.id === activeId);
          const overTaskIndex = newColumns[overColumnIndex].tasks.findIndex(t => t.id === overId);
          
          const [removedTask] = newColumns[activeColumnIndex].tasks.splice(activeTaskIndex, 1);
          removedTask.columnId = newColumns[overColumnIndex].id;
          
          // Insert the task into the new column
          newColumns[overColumnIndex].tasks.splice(overTaskIndex, 0, removedTask);
          return newColumns;
        }

        // Moving within the same column
        const newColumns = [...columns];
        const taskActiveIndex = newColumns[activeColumnIndex].tasks.findIndex(t => t.id === activeId);
        const taskOverIndex = newColumns[overColumnIndex].tasks.findIndex(t => t.id === overId);
        
        newColumns[activeColumnIndex].tasks = arrayMove(
          newColumns[activeColumnIndex].tasks,
          taskActiveIndex,
          taskOverIndex
        );

        return newColumns;
      });
    }

    // Scenario 2: Dropping a Task over an empty Column area
    if (isActiveTask && isOverColumn) {
      setColumns((columns) => {
        const activeColumnIndex = columns.findIndex((col) => col.tasks.some(t => t.id === activeId));
        const overColumnIndex = columns.findIndex((col) => col.id === overId);

        if (activeColumnIndex !== overColumnIndex) {
          const newColumns = [...columns];
          const activeTaskIndex = newColumns[activeColumnIndex].tasks.findIndex(t => t.id === activeId);
          const [removedTask] = newColumns[activeColumnIndex].tasks.splice(activeTaskIndex, 1);
          removedTask.columnId = newColumns[overColumnIndex].id;
          newColumns[overColumnIndex].tasks.push(removedTask);
          return newColumns;
        }

        return columns;
      });
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    // Handle column moving (simplified logic, skipping API for brevity if desired)
    // We will focus on Task moving as requested.
    
    if (active.data.current?.type === "Task") {
      // At this point, local state `columns` is already updated by `onDragOver`.
      // We just need to find its final position and column, and fire the mutation.
      const taskId = active.id as string;
      const finalColumn = columns.find(col => col.tasks.some(t => t.id === taskId));
      if (!finalColumn) return;

      const finalTaskIndex = finalColumn.tasks.findIndex(t => t.id === taskId);
      // Our API positions are 1-indexed based on our backend logic.
      const newPosition = finalTaskIndex + 1;

      // Make API call in the background
      moveTaskMutation.mutate({
        taskId,
        newColumnId: finalColumn.id,
        newPosition,
      });
    }
  }

  return (
    <div className="flex h-full w-full overflow-x-auto overflow-y-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 p-4 items-start">
          <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
            {columns.map((col) => (
              <KanbanColumn key={col.id} column={col} />
            ))}
          </SortableContext>
        </div>

        {/* Drag Overlay for smooth animations */}
        <DragOverlay>
          {activeColumn && <KanbanColumn column={activeColumn} />}
          {activeTask && <TaskCard task={activeTask} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
