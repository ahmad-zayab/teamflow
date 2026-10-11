export type Task = {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  columnId: string;
  position: number;
};

export type Column = {
  id: string;
  name: string;
  projectId: string;
  position: number;
  tasks: Task[];
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  columns: Column[];
};
