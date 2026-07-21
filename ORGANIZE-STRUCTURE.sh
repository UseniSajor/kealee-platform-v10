#!/bin/bash
set -e
cd /home/tim_chamberlain/kealee-platform-v10

echo '=========================================='
echo 'KEALEE PLATFORM v10 - STRUCTURE ORGANIZATION'
echo '=========================================='
echo ''

# Create docs subdirectory structure
echo 'Creating docs subdirectors...'
mkdir -p docs/quick-start
mkdir -p docs/architecture  
mkdir -p docs/development-guides
mkdir -p docs/api-reference
mkdir -p docs/deployment-production
mkdir -p docs/implementation-reports
mkdir -p docs/checklists-procedures
mkdir -p docs/completed-features
mkdir -p docs/reference-materials
mkdir -p docs/_archived

echo 'Creating subdirectories: DONE'
echo ''

# Move files to appropriate categories
echo 'Organizing documentation files...'

# Quick start files
for file in FINDING-YOUR-PROJECT.md HOW_TO_ACCESS.md VS-CODE-CLAUDE-CODE-GUIDE.md VS-CODE-DAILY-CHEAT-SHEET.md SESSION-13-QUICK-REFERENCE.md SUPABASE-QUICK-CHECKLIST.md SUPABASE-AUTH-VERIFICATION.md KEALEE-COMPLETE-INTEGRATION-GUIDE.md; do
  [ -f " \
