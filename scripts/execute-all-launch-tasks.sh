#!/bin/bash

# Execute All Launch Tasks
# Runs all launch preparation tasks in sequence

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log "=========================================="
log "EXECUTING ALL LAUNCH TASKS"
log "=========================================="
echo ""

# Task 1: Test Permit Applications
log "Task 1: Testing permit applications..."
if [ -f "scripts/test-permit-applications.sh" ]; then
    bash scripts/test-permit-applications.sh || warn "Permit application tests had issues"
else
    warn "Permit application test script not found"
fi
echo ""

# Task 2: Performance Optimization
log "Task 2: Performance optimization..."
if [ -f "scripts/performance-optimization.sh" ]; then
    bash scripts/performance-optimization.sh || warn "Performance optimization had issues"
else
    warn "Performance optimization script not found"
fi
echo ""

# Task 3: Load Testing
log "Task 3: Load testing..."
if [ -f "scripts/load-testing.sh" ]; then
    bash scripts/load-testing.sh || warn "Load testing had issues"
else
    warn "Load testing script not found"
fi
echo ""

# Task 4: Security Hardening
log "Task 4: Security hardening..."
if [ -f "scripts/security-hardening.sh" ]; then
    bash scripts/security-hardening.sh || warn "Security hardening had issues"
else
    warn "Security hardening script not found"
fi
echo ""

# Task 5: User Acceptance Testing
log "Task 5: User acceptance testing setup..."
if [ -f "scripts/user-acceptance-testing.sh" ]; then
    bash scripts/user-acceptance-testing.sh || warn "UAT setup had issues"
else
    warn "UAT script not found"
fi
echo ""

# Task 6: Bug Fixing Workflow
log "Task 6: Bug fixing workflow setup..."
if [ -f "scripts/bug-fixing-workflow.sh" ]; then
    bash scripts/bug-fixing-workflow.sh || warn "Bug fixing workflow setup had issues"
else
    warn "Bug fixing workflow script not found"
fi
echo ""

# Task 7: Documentation Setup
log "Task 7: Documentation setup..."
if [ -f "scripts/documentation-setup.sh" ]; then
    bash scripts/documentation-setup.sh || warn "Documentation setup had issues"
else
    warn "Documentation setup script not found"
fi
echo ""

# Task 8: Marketing Launch Prep
log "Task 8: Marketing launch preparation..."
if [ -f "scripts/marketing-launch-prep.sh" ]; then
    bash scripts/marketing-launch-prep.sh || warn "Marketing launch prep had issues"
else
    warn "Marketing launch prep script not found"
fi
echo ""

# Task 9: SEO Optimization
log "Task 9: SEO optimization..."
if [ -f "scripts/seo-optimization.sh" ]; then
    bash scripts/seo-optimization.sh || warn "SEO optimization had issues"
else
    warn "SEO optimization script not found"
fi
echo ""

# Task 10: Content Deployment
log "Task 10: Content deployment preparation..."
if [ -f "scripts/content-deployment.sh" ]; then
    bash scripts/content-deployment.sh || warn "Content deployment prep had issues"
else
    warn "Content deployment script not found"
fi
echo ""

# Task 11: GO LIVE Preparation
log "Task 11: GO LIVE preparation..."
if [ -f "scripts/go-live.sh" ]; then
    bash scripts/go-live.sh || warn "GO LIVE prep had issues"
else
    warn "GO LIVE script not found"
fi
echo ""

# Task 12: Monitor First Transactions
log "Task 12: Setting up transaction monitoring..."
if [ -f "scripts/monitor-first-transactions.sh" ]; then
    bash scripts/monitor-first-transactions.sh || warn "Transaction monitoring setup had issues"
else
    warn "Transaction monitoring script not found"
fi
echo ""

# Task 13: Support Team Training
log "Task 13: Support team training setup..."
if [ -f "scripts/support-team-training.sh" ]; then
    bash scripts/support-team-training.sh || warn "Support training setup had issues"
else
    warn "Support training script not found"
fi
echo ""

log "=========================================="
log "ALL LAUNCH TASKS COMPLETED"
log "=========================================="
log ""
log "Next steps:"
log "1. Review all generated checklists and documentation"
log "2. Complete any manual tasks"
log "3. Run final tests"
log "4. Execute GO LIVE checklist"
log "5. Launch! 🚀"
