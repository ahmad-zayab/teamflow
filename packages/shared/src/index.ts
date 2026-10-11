// @teamflow/shared - Shared types, interfaces, and utilities

// ─── Example shared types ────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

// ─── Utility types ────────────────────────────────────────────────────────────

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ID = string;

export * from './auth.schema.js';
export * from './org.schema.js';
export * from './project.schema.js';
export * from './column.schema.js';
export * from './task.schema.js';


