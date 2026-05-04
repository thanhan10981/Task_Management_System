CREATE TABLE "task_groups" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(20),
    "position" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "task_groups_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "task_groups"
  ADD CONSTRAINT "task_groups_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "task_groups_projectId_name_key" ON "task_groups"("projectId", "name");
CREATE UNIQUE INDEX "task_groups_projectId_position_key" ON "task_groups"("projectId", "position");
CREATE INDEX "task_groups_projectId_idx" ON "task_groups"("projectId");

ALTER TABLE "tasks"
  ADD COLUMN "groupId" TEXT;

ALTER TABLE "tasks"
  ADD CONSTRAINT "tasks_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "task_groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "tasks_groupId_idx" ON "tasks"("groupId");