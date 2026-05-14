CREATE TABLE "project_settings" (
    "projectId" TEXT NOT NULL,
    "rolePermissions" JSONB,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "project_settings_pkey" PRIMARY KEY ("projectId")
);

ALTER TABLE "project_settings"
ADD CONSTRAINT "project_settings_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
