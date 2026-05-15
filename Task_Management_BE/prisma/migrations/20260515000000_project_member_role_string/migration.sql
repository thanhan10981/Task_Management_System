ALTER TABLE "project_members"
  ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "project_members"
  ALTER COLUMN "role" TYPE VARCHAR(40) USING "role"::text;

ALTER TABLE "project_members"
  ALTER COLUMN "role" SET DEFAULT 'DEVELOPER';

DROP TYPE IF EXISTS "project_member_role";
