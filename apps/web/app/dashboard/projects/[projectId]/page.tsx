"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Board } from "@/components/kanban/Board";
import { Project } from "@/types/kanban";
import { use, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  // Use React.use() to unwrap the params promise for Next.js App Router dynamic routes
  const unwrappedParams = use(params);
  
  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ["project", unwrappedParams.projectId],
    queryFn: async () => {
      // In a real app, orgId might be stored in context/store, but assuming backend extracts it from token or headers
      // For this demo, let's assume the backend finds it from the project or we pass a hardcoded/stored header
      const res = await api.get(`/projects/${unwrappedParams.projectId}`, {
        // headers: { 'x-org-id': 'org-id-here' } // Optional based on how OrgGuard is configured globally
      });
      return res.data;
    },
  });

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
      {/* Project Header */}
      <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900 z-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
        {project.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.description}</p>
        )}
      </header>

      {/* Kanban Board Area */}
      <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950">
        <Board project={project} />
      </main>
    </div>
  );
}
