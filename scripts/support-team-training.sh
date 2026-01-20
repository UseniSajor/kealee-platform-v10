#!/bin/bash

# Support Team Training Script
# Creates training materials for support team

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[TRAINING]${NC} $1"
}

log "Creating support team training materials..."
echo ""

# Create training materials directory
mkdir -p support/training

# Support team training guide
cat > support/training/SUPPORT_TRAINING_GUIDE.md <<'EOF'
# Support Team Training Guide

## Platform Overview

### What is Kealee Platform?
Kealee Platform is a comprehensive construction project management system that includes:
- Project management
- Permit applications
- Payment processing
- Inspection scheduling
- File management
- Contract management

### Key Features
- **Projects**: Create and manage construction projects
- **Permits**: Submit and track permit applications
- **Payments**: Process payments and manage invoices
- **Inspections**: Schedule and track building inspections
- **Files**: Upload and share project documents
- **Contracts**: Create and manage contracts with DocuSign

## Common User Issues

### Registration & Login
**Issue**: User can't register
- Check if email is already registered
- Verify email format
- Check for account lockout
- Verify email verification status

**Issue**: User can't login
- Verify email and password
- Check if account is locked
- Verify email is verified
- Check for password reset needed

### Projects
**Issue**: Can't create project
- Verify user has permission
- Check organization membership
- Verify subscription status
- Check for required fields

**Issue**: Can't access project
- Verify user has access
- Check organization membership
- Verify project status
- Check permissions

### Permits
**Issue**: Can't submit permit
- Verify all required fields
- Check document uploads
- Verify jurisdiction selection
- Check payment status

**Issue**: Permit status not updating
- Check jurisdiction system
- Verify submission was successful
- Check for corrections needed
- Verify payment was processed

### Payments
**Issue**: Payment failed
- Check payment method
- Verify card details
- Check for insufficient funds
- Verify payment method is active

**Issue**: Payment not showing
- Check payment processing status
- Verify payment was successful
- Check for refunds
- Verify account balance

### Inspections
**Issue**: Can't schedule inspection
- Verify permit is approved
- Check available time slots
- Verify inspector availability
- Check for required documents

**Issue**: Inspection results not showing
- Check inspection completion status
- Verify inspector submitted results
- Check for photos uploaded
- Verify permit status

## Escalation Procedures

### Level 1: Basic Support
- Password resets
- Account access issues
- Basic feature questions
- General inquiries

### Level 2: Technical Support
- Payment processing issues
- File upload problems
- API errors
- Integration issues

### Level 3: Engineering
- System bugs
- Data corruption
- Security issues
- Performance problems

## Support Tools

### Ticketing System
- Create tickets for all issues
- Assign priority levels
- Track resolution time
- Document solutions

### Knowledge Base
- Search for solutions
- Update articles
- Create new articles
- Link to relevant docs

### Monitoring Dashboards
- Check system status
- Monitor error rates
- Track performance
- View user activity

## Response Templates

### Welcome Email
```
Hi [Name],

Welcome to Kealee Platform! We're excited to have you on board.

If you have any questions, please don't hesitate to reach out.

Best regards,
Support Team
```

### Password Reset
```
Hi [Name],

We've received a request to reset your password. Click the link below to reset:

[Reset Link]

If you didn't request this, please ignore this email.

Best regards,
Support Team
```

### Payment Issue
```
Hi [Name],

We're looking into your payment issue and will get back to you within 24 hours.

In the meantime, please check:
- Payment method is active
- Sufficient funds available
- Card details are correct

Best regards,
Support Team
```

## Training Checklist

- [ ] Platform overview completed
- [ ] Common issues reviewed
- [ ] Escalation procedures understood
- [ ] Support tools trained
- [ ] Response templates reviewed
- [ ] Practice scenarios completed
- [ ] Ready to support users
EOF

# Create FAQ document
cat > support/training/FAQ.md <<'EOF'
# Frequently Asked Questions

## General

**Q: What is Kealee Platform?**
A: Kealee Platform is a comprehensive construction project management system.

**Q: How do I get started?**
A: Register for an account, complete your profile, and create your first project.

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, and Edge (latest versions).

## Billing

**Q: How do I change my subscription?**
A: Go to Settings > Billing and select a new plan.

**Q: Can I cancel my subscription?**
A: Yes, you can cancel at any time from Settings > Billing.

**Q: What payment methods are accepted?**
A: Credit cards and ACH transfers.

## Permits

**Q: How long does permit approval take?**
A: Typically 2-4 weeks, depending on the jurisdiction.

**Q: Can I track my permit status?**
A: Yes, you can view permit status in the Permits section.

**Q: What if my permit is rejected?**
A: You'll receive corrections and can resubmit.

## Support

**Q: How do I contact support?**
A: Email support@kealee.com or use the in-app chat.

**Q: What are your support hours?**
A: Monday-Friday, 9 AM - 5 PM PST.

**Q: How quickly will I get a response?**
A: We aim to respond within 24 hours.
EOF

log "✅ Support training materials created"
log ""
log "Training materials created in:"
log "- support/training/SUPPORT_TRAINING_GUIDE.md"
log "- support/training/FAQ.md"
log ""
log "Next steps:"
log "1. Review training materials"
log "2. Conduct training sessions"
log "3. Practice with test scenarios"
log "4. Set up support tools"
log "5. Ready support team for launch"
