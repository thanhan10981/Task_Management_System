-- Backfill project_id from task relation when possible.
UPDATE "files" AS f
SET "project_id" = t."project_id"
FROM "tasks" AS t
WHERE f."task_id" = t."id"
  AND f."project_id" IS NULL;

-- Safety check: fail migration when any file still has no project.
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM "files"
  WHERE "project_id" IS NULL;

  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot set files.project_id to NOT NULL. % rows still have NULL project_id.', null_count;
  END IF;
END $$;

ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "files_project_id_fkey";

ALTER TABLE "files"
ALTER COLUMN "project_id" SET NOT NULL;

ALTER TABLE "files"
ADD CONSTRAINT "files_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
