ALTER TABLE "task_history"
DROP CONSTRAINT "task_history_userId_fkey";

ALTER TABLE "task_history"
DROP CONSTRAINT "task_history_taskId_fkey";

ALTER TABLE "task_history"
ADD COLUMN "metadata" JSONB;

UPDATE "task_history" AS th
SET "userId" = t."createdBy"
FROM "tasks" AS t
WHERE th."taskId" = t."id"
  AND th."userId" IS NULL;

UPDATE "task_history"
SET "metadata" = jsonb_strip_nulls(
  jsonb_build_object(
    'legacy',
    jsonb_build_object(
      'old',
      "oldValue",
      'new',
      "newValue"
    )
  )
)
WHERE "oldValue" IS NOT NULL
   OR "newValue" IS NOT NULL;

ALTER TABLE "task_history"
DROP COLUMN "oldValue",
DROP COLUMN "newValue";

ALTER TABLE "task_history"
RENAME COLUMN "taskId" TO "task_id";

ALTER TABLE "task_history"
RENAME COLUMN "userId" TO "user_id";

ALTER TABLE "task_history"
RENAME COLUMN "action" TO "action_type";

ALTER TABLE "task_history"
RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "task_history"
ALTER COLUMN "user_id" SET NOT NULL;

ALTER TABLE "task_history"
ALTER COLUMN "action_type" TYPE VARCHAR(50);

DROP INDEX IF EXISTS "task_history_taskId_idx";

CREATE INDEX "task_history_task_id_created_at_idx"
ON "task_history"("task_id", "created_at");

CREATE INDEX "task_history_action_type_idx"
ON "task_history"("action_type");

ALTER TABLE "task_history"
ADD CONSTRAINT "task_history_task_id_fkey"
FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_history"
ADD CONSTRAINT "task_history_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
