-- ============================================================================
-- 04_create_documents.sql
-- File Storage and Document Management Tables
-- Depends on: 01_create_tables.sql
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE file_status AS ENUM (
        'UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED', 'DELETED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- FILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "File" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key TEXT NOT NULL UNIQUE, -- S3/R2 object key
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size BIGINT NOT NULL, -- Size in bytes
    uploaded_by TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    status file_status DEFAULT 'UPLOADING',
    folder TEXT DEFAULT 'uploads',
    metadata JSONB,
    version INTEGER DEFAULT 1,
    parent_file_id TEXT REFERENCES "File"(id) ON DELETE SET NULL, -- For versioning
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_file_key ON "File"(key);
CREATE INDEX IF NOT EXISTS idx_file_uploaded_by ON "File"(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_status ON "File"(status);
CREATE INDEX IF NOT EXISTS idx_file_folder ON "File"(folder);
CREATE INDEX IF NOT EXISTS idx_file_parent_file_id ON "File"(parent_file_id);
CREATE INDEX IF NOT EXISTS idx_file_created_at ON "File"(created_at);

-- ============================================================================
-- FILE VERSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "FileVersion" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    file_id TEXT NOT NULL REFERENCES "File"(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    key TEXT NOT NULL, -- S3/R2 object key for this version
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size BIGINT NOT NULL,
    uploaded_by TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    change_description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(file_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_file_version_file_id ON "FileVersion"(file_id);
CREATE INDEX IF NOT EXISTS idx_file_version_version_number ON "FileVersion"(version_number);
CREATE INDEX IF NOT EXISTS idx_file_version_created_at ON "FileVersion"(created_at);

-- ============================================================================
-- DOCUMENT SHARES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "DocumentShare" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    file_id TEXT NOT NULL REFERENCES "File"(id) ON DELETE CASCADE,
    shared_by TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    shared_with_user_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
    shared_with_org_id TEXT REFERENCES "Org"(id) ON DELETE CASCADE,
    permissions TEXT[] DEFAULT ARRAY['view'], -- view, comment, edit, download
    expires_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_share_file_id ON "DocumentShare"(file_id);
CREATE INDEX IF NOT EXISTS idx_document_share_shared_by ON "DocumentShare"(shared_by);
CREATE INDEX IF NOT EXISTS idx_document_share_shared_with_user_id ON "DocumentShare"(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_document_share_shared_with_org_id ON "DocumentShare"(shared_with_org_id);

-- ============================================================================
-- DOCUMENT COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "DocumentComment" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    file_id TEXT NOT NULL REFERENCES "File"(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    x_position DECIMAL(10, 2), -- For PDF/page markup
    y_position DECIMAL(10, 2),
    page_number INTEGER,
    parent_comment_id TEXT REFERENCES "DocumentComment"(id) ON DELETE CASCADE, -- For threaded comments
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_comment_file_id ON "DocumentComment"(file_id);
CREATE INDEX IF NOT EXISTS idx_document_comment_user_id ON "DocumentComment"(user_id);
CREATE INDEX IF NOT EXISTS idx_document_comment_parent_comment_id ON "DocumentComment"(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_document_comment_resolved ON "DocumentComment"(resolved);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "File" IS 'File storage metadata for S3/R2 uploads';
COMMENT ON TABLE "FileVersion" IS 'Version history for files';
COMMENT ON TABLE "DocumentShare" IS 'File sharing permissions and access';
COMMENT ON TABLE "DocumentComment" IS 'Comments and annotations on documents';
