/*
  Warnings:

  - You are about to drop the column `messageId` on the `files` table. All the data in the column will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_messageId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_projectId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_replyToMessageId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderId_fkey";

-- DropIndex
DROP INDEX "files_messageId_idx";

-- AlterTable
ALTER TABLE "files" DROP COLUMN "messageId";

-- DropTable
DROP TABLE "messages";

-- DropEnum
DROP TYPE "message_scope";

-- DropEnum
DROP TYPE "message_type";
