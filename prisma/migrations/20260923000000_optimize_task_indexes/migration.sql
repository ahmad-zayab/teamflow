-- Optimization migration: Add compound index for high-concurrency board queries
CREATE INDEX IF NOT EXISTS "idx_tasks_project_status_order" ON "tasks"("projectId", "status", "order");
CREATE INDEX IF NOT EXISTS "idx_memberships_org_role" ON "memberships"("organizationId", "role");
CREATE INDEX IF NOT EXISTS "idx_comments_task_created" ON "comments"("taskId", "createdAt" DESC);
