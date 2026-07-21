#!/bin/bash

# Documentation Setup Script
# Creates comprehensive documentation structure

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[DOCS]${NC} $1"
}

log "Setting up documentation..."
echo ""

# Create documentation structure
mkdir -p docs/{user-guide,api-reference,developer-guide,deployment}

# User Guide
cat > docs/user-guide/README.md <<'EOF'
# User Guide

## Getting Started
- [Registration & Login](getting-started/registration.md)
- [Dashboard Overview](getting-started/dashboard.md)
- [Profile Setup](getting-started/profile.md)

## Projects
- [Creating a Project](projects/creating.md)
- [Managing Projects](projects/managing.md)
- [Project Collaboration](projects/collaboration.md)

## Permits
- [Applying for a Permit](permits/applying.md)
- [Tracking Permit Status](permits/tracking.md)
- [Responding to Corrections](permits/corrections.md)

## Payments
- [Adding Payment Methods](payments/methods.md)
- [Processing Payments](payments/processing.md)
- [Viewing Payment History](payments/history.md)

## Inspections
- [Scheduling Inspections](inspections/scheduling.md)
- [Preparing for Inspections](inspections/preparation.md)
- [Viewing Inspection Results](inspections/results.md)
EOF

# API Reference
cat > docs/api-reference/README.md <<'EOF'
# API Reference

## Authentication
- [Getting Started](authentication/getting-started.md)
- [API Keys](authentication/api-keys.md)
- [OAuth2](authentication/oauth2.md)

## Endpoints
- [Projects API](endpoints/projects.md)
- [Permits API](endpoints/permits.md)
- [Payments API](endpoints/payments.md)
- [Files API](endpoints/files.md)
- [Inspections API](endpoints/inspections.md)

## Webhooks
- [Webhook Setup](webhooks/setup.md)
- [Webhook Events](webhooks/events.md)
- [Webhook Security](webhooks/security.md)

## Rate Limiting
- [Rate Limits](rate-limiting/limits.md)
- [Handling Rate Limits](rate-limiting/handling.md)
EOF

# Developer Guide
cat > docs/developer-guide/README.md <<'EOF'
# Developer Guide

## Setup
- [Local Development](setup/local-development.md)
- [Environment Variables](setup/environment-variables.md)
- [Database Setup](setup/database.md)

## Architecture
- [System Overview](architecture/overview.md)
- [API Architecture](architecture/api.md)
- [Frontend Architecture](architecture/frontend.md)

## Development
- [Coding Standards](development/standards.md)
- [Testing](development/testing.md)
- [Code Review Process](development/code-review.md)

## Deployment
- [CI/CD Pipeline](deployment/cicd.md)
- [Staging Deployment](deployment/staging.md)
- [Production Deployment](deployment/production.md)
EOF

# Deployment Guide
cat > docs/deployment/README.md <<'EOF'
# Deployment Guide

## Prerequisites
- [System Requirements](prerequisites/requirements.md)
- [Environment Setup](prerequisites/environment.md)

## Deployment Process
- [Pre-Deployment Checklist](process/pre-deployment.md)
- [Deployment Steps](process/steps.md)
- [Post-Deployment Verification](process/verification.md)

## Monitoring
- [Setting Up Monitoring](monitoring/setup.md)
- [Alert Configuration](monitoring/alerts.md)
- [Performance Monitoring](monitoring/performance.md)

## Troubleshooting
- [Common Issues](troubleshooting/common-issues.md)
- [Rollback Procedure](troubleshooting/rollback.md)
EOF

log "✅ Documentation structure created"
log ""
log "Documentation created in:"
log "- docs/user-guide/"
log "- docs/api-reference/"
log "- docs/developer-guide/"
log "- docs/deployment/"
log ""
log "Next steps:"
log "1. Fill in documentation content"
log "2. Add screenshots and examples"
log "3. Review and update regularly"
log "4. Publish to documentation site"
