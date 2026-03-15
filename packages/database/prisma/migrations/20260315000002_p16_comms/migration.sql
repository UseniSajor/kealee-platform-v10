-- P16: Unified Communications Layer
-- InAppNotification + NotificationPreference tables

CREATE TABLE "in_app_notifications" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "event"      TEXT NOT NULL,
    "title"      TEXT NOT NULL,
    "body"       TEXT NOT NULL,
    "entityType" TEXT,
    "entityId"   TEXT,
    "isRead"     BOOLEAN NOT NULL DEFAULT false,
    "readAt"     TIMESTAMP(3),
    "metadata"   JSONB NOT NULL DEFAULT '{}',
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "in_app_notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_preferences" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "event"     TEXT NOT NULL,
    "channels"  TEXT[],
    "enabled"   BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "in_app_notifications_userId_isRead_idx" ON "in_app_notifications"("userId", "isRead");
CREATE INDEX "in_app_notifications_userId_createdAt_idx" ON "in_app_notifications"("userId", "createdAt" DESC);
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");
CREATE UNIQUE INDEX "notification_preferences_userId_event_key" ON "notification_preferences"("userId", "event");

-- Foreign keys (references users table)
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
