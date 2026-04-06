-- Remove project date columns from projects table
ALTER TABLE "projects"
  DROP COLUMN "startDate",
  DROP COLUMN "endDate";
