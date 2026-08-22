-- Clerk is the sole identity authority for newly-created users. Existing rows
-- retain their recorded provider until their identity is explicitly linked.
ALTER TABLE "User" ALTER COLUMN "authProvider" SET DEFAULT 'clerk';
