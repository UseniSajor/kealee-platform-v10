# Admin Training Materials - Kealee Platform

## Table of Contents

1. [System Overview](#system-overview)
2. [Admin Console Navigation](#admin-console-navigation)
3. [User Management](#user-management)
4. [Project Management](#project-management)
5. [Financial Operations](#financial-operations)
6. [Dispute Resolution](#dispute-resolution)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## System Overview

### Architecture

Kealee Platform consists of:

- **OS Foundation** (Backend): Core services, database, authentication
- **Ops OS Core** (Admin): Internal admin console for staff
- **Profit Center Apps**: Customer-facing applications
  - `m-project-owner`: Project Owner Hub
  - `m-marketplace`: Contractor Marketplace
  - `m-ops-services`: Ops Services Hub
  - `m-finance-trust`: Finance & Trust Hub

### Key Technologies

- **Backend**: Fastify (Node.js), PostgreSQL, Prisma ORM
- **Frontend**: Next.js 16, React, Tailwind CSS
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Document Signing**: DocuSign
- **Monitoring**: Custom dashboards + logging

---

## Admin Console Navigation

### Main Sections

1. **Dashboard**: Overview of system health, active projects, recent activity
2. **Users**: User management, roles, permissions
3. **Projects**: View and manage all projects
4. **Contracts**: Contract oversight and management
5. **Payments**: Escrow and payment monitoring
6. **Disputes**: Dispute resolution tools
7. **Audit Logs**: System activity tracking
8. **Settings**: System configuration

### Key Metrics Dashboard

Monitor:
- Active projects count
- Total escrow balance
- Pending approvals
- Active disputes
- System health status
- Recent errors/alerts

---

## User Management

### User Roles

- **OWNER**: Project owners (customers)
- **CONTRACTOR**: Contractors in marketplace
- **PM**: Kealee project managers
- **ADMIN**: System administrators
- **SUPPORT**: Customer support staff

### Common Tasks

#### Creating Users

1. Navigate to Users → New User
2. Enter email, name, role
3. User receives invitation email
4. User completes profile setup

#### Managing Permissions

1. Select user
2. Edit role/permissions
3. Assign to organizations
4. Set module entitlements

#### Deactivating Users

1. Find user
2. Click "Deactivate"
3. User loses access immediately
4. Data is preserved for audit

### Best Practices

- Always verify user identity before granting admin access
- Use least-privilege principle
- Regularly audit user permissions
- Document permission changes

---

## Project Management

### Viewing Projects

**Project List View**:
- Filter by status, category, owner
- Sort by date, amount, status
- Search by name or ID

**Project Detail View**:
- Full project information
- Timeline and milestones
- Contract details
- Payment history
- Activity log

### Common Admin Tasks

#### Project Status Changes

**Manual Status Update**:
1. Navigate to project
2. Click "Edit Status"
3. Select new status
4. Provide reason (required)
5. System logs change

**Status Flow**:
```
DRAFT → READINESS → CONTRACTING → ACTIVE → CLOSEOUT → COMPLETED
```

#### Escalating Issues

1. Identify problematic project
2. Add internal notes
3. Assign to PM or support team
4. Set priority level
5. Monitor resolution

#### Project Cancellation

1. Verify cancellation reason
2. Check contract terms
3. Process refunds (if applicable)
4. Update project status
5. Notify all parties

---

## Financial Operations

### Escrow Management

#### Viewing Escrow Accounts

- **By Project**: See escrow for specific project
- **All Accounts**: Overview of all escrow balances
- **Transactions**: All payment transactions

#### Escrow Status

- **ACTIVE**: Normal operation
- **FROZEN**: Dispute filed, payments blocked
- **CLOSED**: Project completed, balance zero

#### Manual Escrow Operations

**Freeze Escrow** (for disputes):
1. Navigate to project escrow
2. Click "Freeze Escrow"
3. Provide reason
4. System blocks all payments

**Unfreeze Escrow**:
1. Navigate to escrow
2. Click "Unfreeze"
3. Verify dispute resolution
4. Payments resume

**Manual Payment Release** (emergency only):
1. Navigate to transaction
2. Click "Manual Release"
3. Provide authorization
4. Enter reason
5. Process payment

### Payment Monitoring

**Key Metrics**:
- Total escrow balance
- Pending releases
- Failed transactions
- Refund requests

**Alerts**:
- Low escrow balance
- Failed payment attempts
- Unusual transaction patterns
- Dispute-related freezes

---

## Dispute Resolution

### Dispute Workflow

1. **Filed**: Dispute created, escrow frozen
2. **Under Investigation**: Admin reviews evidence
3. **Pending Mediation**: Mediator assigned (if needed)
4. **Pending Resolution**: Awaiting decision
5. **Resolved**: Outcome determined, escrow unfrozen

### Admin Actions

#### Reviewing Disputes

1. Navigate to Disputes → Active
2. Review dispute details
3. Check evidence and comments
4. Review project history
5. Make resolution decision

#### Resolving Disputes

**Resolution Options**:
- **OWNER_WINS**: Full refund to owner
- **CONTRACTOR_WINS**: Release payment to contractor
- **PARTIAL_OWNER**: Partial refund
- **PARTIAL_CONTRACTOR**: Partial payment
- **MEDIATED_SETTLEMENT**: Custom settlement
- **WITHDRAWN**: Dispute withdrawn

**Resolution Steps**:
1. Select resolution outcome
2. Enter resolution notes
3. Set payment amounts (if partial)
4. Auto-approve related milestones (if applicable)
5. Submit resolution
6. System unfreezes escrow and processes payments

#### Requesting Mediation

1. Navigate to dispute
2. Click "Request Mediation"
3. Assign mediator
4. Set mediation deadline
5. Mediator reviews and provides recommendation

---

## Monitoring & Alerts

### System Health Monitoring

**Key Metrics**:
- API response times
- Database query performance
- Error rates
- Active connections
- Queue processing times

**Health Checks**:
- `/health`: Basic health check
- `/health/db`: Database connectivity
- `/health/stripe`: Payment gateway status
- `/health/docusign`: DocuSign integration status

### Alert Types

#### Critical Alerts

- System downtime
- Payment processing failures
- Database connection issues
- Security breaches

#### Warning Alerts

- High error rates
- Slow response times
- Escrow balance issues
- Failed integrations

#### Info Alerts

- Scheduled maintenance
- Feature updates
- User activity milestones

### Monitoring Dashboard

**Access**: Admin Console → Monitoring

**Sections**:
1. **System Health**: Overall system status
2. **Performance**: Response times, throughput
3. **Errors**: Error logs and trends
4. **Financial**: Escrow and payment metrics
5. **User Activity**: Active users, sessions

---

## Troubleshooting

### Common Issues

#### Payment Processing Failures

**Symptoms**: Payments not releasing, errors in logs

**Steps**:
1. Check Stripe integration status
2. Verify escrow balance
3. Review transaction logs
4. Check for active disputes
5. Verify milestone status

**Resolution**:
- Retry failed transactions
- Contact Stripe support if needed
- Manually process if critical

#### Database Performance Issues

**Symptoms**: Slow queries, timeouts

**Steps**:
1. Check database connection pool
2. Review slow query log
3. Check for missing indexes
4. Monitor connection count

**Resolution**:
- Optimize queries
- Add indexes
- Scale database if needed

#### Authentication Issues

**Symptoms**: Users can't log in, token errors

**Steps**:
1. Check Supabase status
2. Verify user exists
3. Check user status (active/inactive)
4. Review auth logs

**Resolution**:
- Reset user password
- Reactivate user if deactivated
- Check Supabase configuration

### Escalation Procedures

**Level 1**: Support team (common issues)
**Level 2**: Technical team (system issues)
**Level 3**: Engineering team (critical bugs)
**Level 4**: CTO/Founder (security/critical business impact)

---

## Best Practices

### Daily Operations

1. **Morning Check**:
   - Review system health dashboard
   - Check for overnight alerts
   - Review pending approvals
   - Check active disputes

2. **Active Monitoring**:
   - Monitor error rates
   - Watch payment processing
   - Track user activity
   - Review support tickets

3. **End of Day**:
   - Review daily metrics
   - Document any issues
   - Plan next day priorities

### Security

- Never share admin credentials
- Use 2FA for admin accounts
- Regularly audit user permissions
- Monitor for suspicious activity
- Keep software updated

### Communication

- Document all admin actions
- Provide clear reasons for decisions
- Communicate with users promptly
- Escalate issues appropriately

### Data Management

- Regular backups verified
- Audit logs reviewed weekly
- Data retention policies followed
- Privacy regulations complied with

---

## Quick Reference

### Keyboard Shortcuts

- `Ctrl+K`: Command palette
- `Ctrl+/`: Search
- `Esc`: Close modals

### Important URLs

- Admin Console: `https://admin.kealee.com`
- API Docs: `https://api.kealee.com/docs`
- Monitoring: `https://admin.kealee.com/monitoring`
- Support Portal: `https://support.kealee.com`

### Emergency Contacts

- **Technical Issues**: tech@kealee.com
- **Security Issues**: security@kealee.com (urgent)
- **Payment Issues**: finance@kealee.com
- **On-Call**: See internal contact list

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Training Required**: 8 hours  
**Certification**: Admin Certification Exam
