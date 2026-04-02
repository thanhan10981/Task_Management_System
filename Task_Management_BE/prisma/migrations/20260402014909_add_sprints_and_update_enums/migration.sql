/*
  Warnings:

  - The values [MESSAGE] on the enum `activity_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [MESSAGE_RECEIVED] on the enum `notification_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "sprint_status" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- AlterEnum
BEGIN;
CREATE TYPE "activity_type_new" AS ENUM ('TASK', 'FILE', 'PROJECT', 'USER', 'SYSTEM');
ALTER TABLE "activity_logs" ALTER COLUMN "entityType" TYPE "activity_type_new" USING ("entityType"::text::"activity_type_new");
ALTER TYPE "activity_type" RENAME TO "activity_type_old";
ALTER TYPE "activity_type_new" RENAME TO "activity_type";
DROP TYPE "activity_type_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "notification_type_new" AS ENUM ('TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_COMMENTED', 'FILE_SHARED', 'SYSTEM');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "notification_type_new" USING ("type"::text::"notification_type_new");
ALTER TYPE "notification_type" RENAME TO "notification_type_old";
ALTER TYPE "notification_type_new" RENAME TO "notification_type";
DROP TYPE "notification_type_old";
COMMIT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "sprintId" TEXT;

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "goal" TEXT,
    "description" TEXT,
    "status" "sprint_status" NOT NULL DEFAULT 'PLANNING',
    "startDate" TIMESTAMPTZ(6),
    "endDate" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "createdBy" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sprints_projectId_status_idx" ON "sprints"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sprints_projectId_name_key" ON "sprints"("projectId", "name");

-- CreateIndex
CREATE INDEX "tasks_projectId_sprintId_idx" ON "tasks"("projectId", "sprintId");

-- CreateIndex
CREATE INDEX "tasks_sprintId_statusId_idx" ON "tasks"("sprintId", "statusId");

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
