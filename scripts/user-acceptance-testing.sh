#!/bin/bash

# User Acceptance Testing Script
# Guides through UAT process

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[UAT]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log "User Acceptance Testing Checklist"
echo ""

cat > UAT_CHECKLIST.md <<'EOF'
# User Acceptance Testing Checklist

## Test Scenarios

### 1. User Registration & Onboarding
- [ ] New user can register
- [ ] Email verification works
- [ ] Onboarding flow is clear
- [ ] User can complete profile setup

### 2. Project Creation
- [ ] User can create a new project
- [ ] Project details can be saved
- [ ] Project can be edited
- [ ] Project can be deleted

### 3. Permit Application
- [ ] User can start permit application
- [ ] Form validation works correctly
- [ ] Documents can be uploaded
- [ ] Application can be submitted
- [ ] Application status is visible

### 4. Payment Processing
- [ ] User can add payment method
- [ ] Payment can be processed
- [ ] Payment history is visible
- [ ] Receipts are generated

### 5. Contract Management
- [ ] User can create contract
- [ ] Contract can be sent for signature
- [ ] Signature process works
- [ ] Signed contract is stored

### 6. File Management
- [ ] Files can be uploaded
- [ ] Files can be downloaded
- [ ] File sharing works
- [ ] File versioning works

### 7. Inspection Scheduling
- [ ] User can schedule inspection
- [ ] Inspection can be rescheduled
- [ ] Inspection results are visible
- [ ] Inspection photos can be uploaded

### 8. Reporting
- [ ] Reports can be generated
- [ ] Report data is accurate
- [ ] Reports can be exported
- [ ] Reports are formatted correctly

## Acceptance Criteria

### Performance
- [ ] Page load time < 3 seconds
- [ ] API response time < 1 second
- [ ] File upload works for files up to 100MB
- [ ] No memory leaks during extended use

### Usability
- [ ] Interface is intuitive
- [ ] Error messages are clear
- [ ] Navigation is logical
- [ ] Mobile responsive

### Functionality
- [ ] All features work as expected
- [ ] Data is saved correctly
- [ ] Calculations are accurate
- [ ] Integrations work properly

### Security
- [ ] User data is protected
- [ ] Authentication works correctly
- [ ] Authorization is enforced
- [ ] Sensitive data is encrypted

## Issues Found

### Critical Issues
- [ ] List critical issues here

### High Priority Issues
- [ ] List high priority issues here

### Medium Priority Issues
- [ ] List medium priority issues here

### Low Priority Issues
- [ ] List low priority issues here

## Sign-off

- [ ] All critical issues resolved
- [ ] All high priority issues resolved
- [ ] UAT approved by stakeholders
- [ ] Ready for production deployment

**Tester Name:** _________________
**Date:** _________________
**Signature:** _________________
EOF

log "✅ UAT checklist created: UAT_CHECKLIST.md"
log ""
log "UAT Process:"
log "1. Review UAT_CHECKLIST.md"
log "2. Test each scenario"
log "3. Document issues found"
log "4. Get stakeholder sign-off"
log "5. Fix critical issues"
log "6. Re-test fixed issues"
log "7. Approve for production"
