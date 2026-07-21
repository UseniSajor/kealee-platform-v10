#!/bin/bash

# Bug Fixing Workflow
# Guides through bug fixing process

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[BUG FIX]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log "Bug Fixing Workflow"
echo ""

cat > BUG_FIXING_WORKFLOW.md <<'EOF'
# Bug Fixing Workflow

## Bug Triage Process

### 1. Bug Reporting
- Use issue tracker (GitHub Issues, Jira, etc.)
- Include:
  - Bug description
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Screenshots/videos
  - Environment details
  - Priority level

### 2. Bug Prioritization

#### P0 - Critical (Fix Immediately)
- System down
- Data loss
- Security vulnerability
- Payment processing failure

#### P1 - High (Fix within 24 hours)
- Major feature broken
- Significant user impact
- Performance degradation

#### P2 - Medium (Fix within 1 week)
- Minor feature issues
- UI/UX problems
- Non-critical bugs

#### P3 - Low (Fix when possible)
- Cosmetic issues
- Minor improvements
- Nice-to-have fixes

### 3. Bug Fixing Process

1. **Reproduce the Bug**
   - Follow steps to reproduce
   - Verify bug exists
   - Document reproduction steps

2. **Identify Root Cause**
   - Check logs
   - Review code
   - Test hypotheses
   - Use debugging tools

3. **Fix the Bug**
   - Write fix
   - Add tests
   - Update documentation
   - Code review

4. **Test the Fix**
   - Test fix locally
   - Run automated tests
   - Test edge cases
   - Regression testing

5. **Deploy the Fix**
   - Deploy to staging
   - Verify fix in staging
   - Deploy to production
   - Monitor after deployment

### 4. Bug Fix Checklist

- [ ] Bug reproduced
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Tests written
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Verified in staging
- [ ] Deployed to production
- [ ] Monitored after deployment
- [ ] Bug closed

## Common Bug Categories

### API Bugs
- Check request/response format
- Verify authentication
- Check rate limiting
- Validate input data

### Frontend Bugs
- Check browser console
- Verify API calls
- Check state management
- Test responsive design

### Database Bugs
- Check queries
- Verify transactions
- Check constraints
- Review migrations

### Integration Bugs
- Check API endpoints
- Verify webhooks
- Check third-party services
- Review error handling

## Bug Fix Template

```markdown
## Bug: [Title]

### Description
[Describe the bug]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- App: [app name]
- Browser: [browser and version]
- OS: [operating system]

### Fix
[Description of fix]

### Testing
[How the fix was tested]

### Related Issues
[Link to related issues]
```

## Tools

- **Error Tracking**: Sentry
- **Logging**: Vercel Logs, CloudWatch
- **Debugging**: Chrome DevTools, VS Code Debugger
- **Testing**: Jest, Playwright, Cypress
- **Monitoring**: Datadog, New Relic
EOF

log "✅ Bug fixing workflow created: BUG_FIXING_WORKFLOW.md"
log ""
log "Bug Fixing Process:"
log "1. Report bug in issue tracker"
log "2. Prioritize bug (P0-P3)"
log "3. Assign to developer"
log "4. Fix bug following workflow"
log "5. Test fix thoroughly"
log "6. Deploy to staging"
log "7. Verify fix"
log "8. Deploy to production"
log "9. Monitor and close bug"
