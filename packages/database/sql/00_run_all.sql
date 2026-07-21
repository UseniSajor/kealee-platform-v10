-- ============================================================================
-- 00_run_all.sql
-- Master script to run all SQL scripts in order
-- ============================================================================

-- This script runs all database setup scripts in the correct order
-- Usage: psql -d your_database -f 00_run_all.sql

\echo 'Starting database setup...'
\echo ''

\echo 'Running 01_create_tables.sql...'
\i 01_create_tables.sql

\echo 'Running 02_create_subscriptions.sql...'
\i 02_create_subscriptions.sql

\echo 'Running 03_create_payments.sql...'
\i 03_create_payments.sql

\echo 'Running 04_create_documents.sql...'
\i 04_create_documents.sql

\echo 'Running 05_create_projects.sql...'
\i 05_create_projects.sql

\echo 'Running 06_create_permits.sql...'
\i 06_create_permits.sql

\echo 'Running 07_create_inspections.sql...'
\i 07_create_inspections.sql

\echo 'Running 08_create_audit_logs.sql...'
\i 08_create_audit_logs.sql

\echo 'Running 09_create_analytics.sql...'
\i 09_create_analytics.sql

\echo 'Running 10_seed_data.sql...'
\i 10_seed_data.sql

\echo ''
\echo 'Database setup complete!'
\echo 'All tables, indexes, and seed data have been created.'
