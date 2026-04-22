-- Backfill projectId from task relation when possible.
UPDATE "files" AS f
SET "projectId" = t."projectId"
FROM "tasks" AS t
WHERE f."taskId" = t."id"
  AND f."projectId" IS NULL;

-- Safety check: fail migration when any file still has no project.
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM "files"
  WHERE "projectId" IS NULL;

  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot set files.projectId to NOT NULL. % rows still have NULL projectId.', null_count;
  END IF;
END $$;

ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "files_projectId_fkey";

ALTER TABLE "files"
ALTER COLUMN "projectId" SET NOT NULL;

ALTER TABLE "files"
ADD CONSTRAINT "files_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
