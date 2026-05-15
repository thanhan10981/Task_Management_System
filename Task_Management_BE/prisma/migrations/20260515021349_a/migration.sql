/*
  Warnings:

  - You are about to drop the column `language` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `user_settings` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "tasks_projectId_isDeleted_idx";

-- AlterTable
ALTER TABLE "user_settings" DROP COLUMN "language",
DROP COLUMN "timezone";
