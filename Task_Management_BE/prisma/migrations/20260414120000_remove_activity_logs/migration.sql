-- Remove activity logs table and enum after deprecating activity log feature
DROP TABLE IF EXISTS "activity_logs";
DROP TYPE IF EXISTS "activity_type";
