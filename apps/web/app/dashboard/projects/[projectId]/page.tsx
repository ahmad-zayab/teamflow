"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Board } from "@/components/kanban/Board";
import { Project, Task } from "@/types/kanban";
import { use, useEffect, useState, Suspense } from "react";
import { Loader2, Users, Wifi, WifiOff } from "lucide-react";
import { useSocket } from "@/lib/socket";

export interface PresenceUser {
  id: string;
  name: string;
  avatar?: string;
}

function ProjectBoardContent({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  // 1. Fetch current authenticated user for presence tracking
  const { data: currentUser } = useQuery<{ id: string; name: string; avatarUrl?: string }>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const res = await api.get("/auth/me");
        return res.data;
      } catch {
        return { id: "guest", name: "Guest User" };
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // 2. Fetch project board
  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}`);
      return res.data;
    },
  });

  // 3. Socket.IO Room & Realtime Events Integration
  useEffect(() => {
    if (!socket || !projectId) return;

    // Join project room and announce live presence
    const joinRoom = () => {
      socket.emit("join:project", { projectId });

      if (currentUser) {
        socket.emit("presence:join", {
          projectId,
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatarUrl,
        });
      }
    };

    if (isConnected) {
      joinRoom();
    }

    // Re-join if socket reconnects
    socket.on("connect", joinRoom);

    // --- Presence Listener ---
    const handlePresenceUpdate = (users: PresenceUser[]) => {
      setOnlineUsers(users);
    };
    socket.on("presence:update", handlePresenceUpdate);

    // --- Task Created Listener ---
    const handleTaskCreated = (newTask: Task) => {
      queryClient.setQueryData<Project>(["project", projectId], (oldProject) => {
        if (!oldProject) return oldProject;

        // Check if task is already in column (prevent duplicate)
        const exists = oldProject.columns.some((c) => c.tasks.some((t) => t.id === newTask.id));
        if (exists) return oldProject;

        return {
          ...oldProject,
          columns: oldProject.columns.map((column) => {
            if (column.id === newTask.columnId) {
              const updatedTasks = [...column.tasks, newTask].sort(
                (a, b) => a.position - b.position
              );
              return { ...column, tasks: updatedTasks };
            }
            return column;
          }),
        };
      });
    };
    socket.on("task:created", handleTaskCreated);

    // --- Task Moved Listener ---
    const handleTaskMoved = (movedTask: Task) => {
      queryClient.setQueryData<Project>(["project", projectId], (oldProject) => {
        if (!oldProject) return oldProject;

        // Remove task from any existing column
        const strippedColumns = oldProject.columns.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== movedTask.id),
        }));

        // Insert task into destination column and maintain sort order
        return {
          ...oldProject,
          columns: strippedColumns.map((col) => {
            if (col.id === movedTask.columnId) {
              const updatedTasks = [...col.tasks, movedTask].sort(
                (a, b) => a.position - b.position
              );
              return { ...col, tasks: updatedTasks };
            }
            return col;
          }),
        };
      });
    };
    socket.on("task:moved", handleTaskMoved);

    // --- Task Deleted Listener ---
    const handleTaskDeleted = (payload: { id: string }) => {
      queryClient.setQueryData<Project>(["project", projectId], (oldProject) => {
        if (!oldProject) return oldProject;

        return {
          ...oldProject,
          columns: oldProject.columns.map((col) => ({
            ...col,
            tasks: col.tasks.filter((t) => t.id !== payload.id),
          })),
        };
      });
    };
    socket.on("task:deleted", handleTaskDeleted);

    // --- Task Updated Listener ---
    const handleTaskUpdated = (updatedTask: Task) => {
      queryClient.setQueryData<Project>(["project", projectId], (oldProject) => {
        if (!oldProject) return oldProject;

        return {
          ...oldProject,
          columns: oldProject.columns.map((col) => {
            if (col.id === updatedTask.columnId) {
              return {
                ...col,
                tasks: col.tasks.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)),
              };
            }
            return col;
          }),
        };
      });
    };
    socket.on("task:updated", handleTaskUpdated);

    // Cleanup: leave project room and clean up listeners
    return () => {
      socket.emit("leave:project", { projectId });
      socket.emit("presence:leave", { projectId });

      socket.off("connect", joinRoom);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("task:created", handleTaskCreated);
      socket.off("task:moved", handleTaskMoved);
      socket.off("task:deleted", handleTaskDeleted);
      socket.off("task:updated", handleTaskUpdated);
    };
  }, [socket, isConnected, projectId, currentUser, queryClient]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center text-red-500">
          <h2 className="text-xl font-semibold">Failed to load project</h2>
          <p className="text-sm mt-2">Make sure you have access to this project.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white dark:bg-gray-900">
      {/* Project Header with Live Presence */}
      <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900 z-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            {/* Real-time Connection Indicator */}
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                isConnected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800"
              }`}
              title={isConnected ? "Realtime WebSocket connected" : "Connecting..."}
            >
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 text-emerald-500" />
                  <span>Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-amber-500" />
                  <span>Connecting</span>
                </>
              )}
            </span>
          </div>
          {project.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.description}</p>
          )}
        </div>

        {/* Live Presence Avatars & Online Counter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Users className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            <span>
              {onlineUsers.length} {onlineUsers.length === 1 ? "user" : "users"} active
            </span>
          </div>

          {/* Active User Avatars Stack */}
          <div className="flex -space-x-2 overflow-hidden items-center">
            {onlineUsers.slice(0, 6).map((user) => (
              <div
                key={user.id}
                title={`${user.name} (Online)`}
                className="relative inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-semibold uppercase shadow-sm">
                    {user.name ? user.name.slice(0, 2) : "U"}
                  </div>
                )}
                {/* Online indicator badge on avatar */}
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
              </div>
            ))}
            {onlineUsers.length > 6 && (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-gray-900"
                title={`${onlineUsers.length - 6} more online`}
              >
                +{onlineUsers.length - 6}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Kanban Board Area */}
      <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950">
        <Board project={project} />
      </main>
    </div>
  );
}

function ProjectParamsUnwrapper({ params }: { params: Promise<{ projectId: string }> }) {
  const unwrappedParams = use(params);
  return <ProjectBoardContent projectId={unwrappedParams.projectId} />;
}

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <ProjectParamsUnwrapper params={params} />
    </Suspense>
  );
}
