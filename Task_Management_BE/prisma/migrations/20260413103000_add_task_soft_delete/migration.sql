ALTER TABLE "tasks"
ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "tasks_projectId_isDeleted_idx" ON "tasks" ("projectId", "isDeleted");
