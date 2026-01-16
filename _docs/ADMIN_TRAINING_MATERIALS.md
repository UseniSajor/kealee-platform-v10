# Admin Training Materials

## Overview

This guide provides comprehensive training materials for Kealee Platform administrators managing the Project Owner Hub and related systems.

## Table of Contents

1. [Admin Dashboard Overview](#admin-dashboard-overview)
2. [User Management](#user-management)
3. [Project Management](#project-management)
4. [Contract Management](#contract-management)
5. [Payment & Escrow Administration](#payment--escrow-administration)
6. [Dispute Resolution](#dispute-resolution)
7. [System Monitoring](#system-monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Emergency Procedures](#emergency-procedures)

---

## Admin Dashboard Overview

### Access Levels

- **Super Admin**: Full system access
- **Admin**: Project and user management
- **Support**: Read-only access with limited actions

### Key Sections

1. **Users**: Manage user accounts and permissions
2. **Projects**: View and manage all projects
3. **Contracts**: Monitor contract status
4. **Payments**: Escrow and payment oversight
5. **Disputes**: Dispute resolution management
6. **Audit Logs**: System activity tracking
7. **Settings**: System configuration

---

## User Management

### Creating Users

1. Navigate to **Users** → **Create User**
2. Enter user details:
   - Email (required, must be unique)
   - Name
   - Role assignment
   - Organization assignment
3. User receives invitation email
4. User completes account setup

### Managing User Roles

**Available Roles:**
- **Project Owner**: Can create and manage projects
- **Contractor**: Can submit milestones and manage contracts
- **PM**: Project manager with oversight capabilities
- **Admin**: Administrative access

**Role Assignment:**
1. Navigate to user profile
2. Click **Edit Roles**
3. Assign/remove roles
4. Save changes

### User Status Management

- **Active**: User can access system
- **Suspended**: Temporary access restriction
- **Deactivated**: Permanent access removal

### Bulk Operations

- Import users via CSV
- Bulk role assignment
- Bulk status updates

---

## Project Management

### Viewing All Projects

1. Navigate to **Projects** → **All Projects**
2. Filter by:
   - Status (DRAFT, READINESS, CONTRACTING, ACTIVE, CLOSEOUT, COMPLETED)
   - Category (Kitchen, Bathroom, etc.)
   - Owner
   - Date range
3. Sort by creation date, status, or owner

### Project Status Transitions

**Manual Status Updates:**
- Use with caution
- Only for exceptional circumstances
- Document reason in audit log

**Automatic Transitions:**
- DRAFT → READINESS: When readiness checklist completed
- READINESS → CONTRACTING: When contract created
- CONTRACTING → ACTIVE: When contract signed
- ACTIVE → CLOSEOUT: When all milestones paid
- CLOSEOUT → COMPLETED: When closeout completed

### Project Intervention

**When to Intervene:**
- Stuck in status for extended period
- User requests assistance
- System errors preventing progression
- Dispute escalation

**Intervention Steps:**
1. Review project history and audit logs
2. Identify blocking issue
3. Contact project owner if needed
4. Resolve issue or provide guidance
5. Document intervention in notes

---

## Contract Management

### Monitoring Contracts

1. View all contracts from **Contracts** dashboard
2. Filter by:
   - Status (DRAFT, SENT, SIGNED, ACTIVE, COMPLETED)
   - Project
   - Contractor
   - Date range

### Contract Issues

**Common Issues:**
- DocuSign envelope not sent
- Signature pending
- Contract expired
- Terms disputes

**Resolution:**
1. Check DocuSign integration status
2. Resend envelope if needed
3. Extend expiration date if required
4. Escalate to legal if terms disputed

### Contract Modifications

- Only super admins can modify signed contracts
- Requires documented reason
- Creates new contract version
- Notifies all parties

---

## Payment & Escrow Administration

### Escrow Account Management

**Viewing Escrow Accounts:**
1. Navigate to **Payments** → **Escrow Accounts**
2. Filter by project, status, or balance
3. View transaction history

**Escrow Status:**
- **ACTIVE**: Normal operation
- **FROZEN**: Dispute active, payments blocked
- **CLOSED**: Project completed, balance zero

### Payment Release Oversight

**Manual Payment Release:**
- Only in exceptional circumstances
- Requires approval workflow
- Document reason thoroughly
- Notify all parties

**Payment Issues:**
- Failed Stripe transfers
- Insufficient escrow balance
- Disputed payments
- Refund requests

### Escrow Freeze/Unfreeze

**Freezing Escrow:**
- Automatic on dispute filing
- Manual freeze for investigations
- Document reason

**Unfreezing Escrow:**
- Automatic on dispute resolution
- Manual unfreeze after investigation
- Verify all conditions met

---

## Dispute Resolution

### Dispute Dashboard

1. Navigate to **Disputes** → **All Disputes**
2. Filter by:
   - Status (FILED, UNDER_INVESTIGATION, PENDING_MEDIATION, RESOLVED)
   - Priority
   - Project
   - Date range

### Dispute Workflow

**1. Review Dispute**
- Read dispute details
- Review evidence
- Check project history
- Review related milestones

**2. Investigation**
- Contact parties if needed
- Gather additional information
- Review contract terms
- Check compliance

**3. Resolution**
- Determine resolution outcome
- Enter resolution notes
- Update dispute status
- Unfreeze escrow if applicable

### Dispute Outcomes

- **OWNER_WINS**: Owner's position upheld
- **CONTRACTOR_WINS**: Contractor's position upheld
- **PARTIAL_OWNER**: Partial resolution favoring owner
- **PARTIAL_CONTRACTOR**: Partial resolution favoring contractor
- **MEDIATED_SETTLEMENT**: Third-party mediation result
- **WITHDRAWN**: Dispute withdrawn by initiator

### Mediation Process

1. Request mediation from dispute detail page
2. Assign mediator
3. Mediator reviews and facilitates
4. Enter mediation notes
5. Update to PENDING_RESOLUTION or RESOLVED

---

## System Monitoring

### Key Metrics to Monitor

**Project Metrics:**
- Active projects count
- Projects by status
- Average project duration
- Milestone approval time

**Payment Metrics:**
- Total escrow balance
- Payment release volume
- Failed payment count
- Average payment processing time

**User Metrics:**
- Active users
- New signups
- User activity levels
- Support ticket volume

**System Health:**
- API response times
- Error rates
- Database performance
- Third-party service status (Stripe, DocuSign)

### Monitoring Dashboard

Access real-time metrics from **Admin** → **Monitoring**

**Alerts:**
- High error rates
- Payment failures
- System downtime
- Unusual activity patterns

### Log Review

**Audit Logs:**
- All system actions
- User activity
- Status changes
- Payment transactions

**Event Logs:**
- System events
- Notifications sent
- Integration events

**Access:**
1. Navigate to **Admin** → **Audit Logs**
2. Filter by:
   - Entity type
   - Action type
   - User
   - Date range
3. Export logs for analysis

---

## Troubleshooting

### Common Issues

**Project Stuck in Status:**
1. Check readiness checklist completion
2. Verify contract status
3. Review milestone status
4. Check for blocking disputes
5. Review audit logs for errors

**Payment Not Processing:**
1. Verify Stripe integration status
2. Check escrow balance
3. Review payment transaction logs
4. Check for active disputes
5. Verify milestone approval status

**User Access Issues:**
1. Verify user status (active/suspended)
2. Check role assignments
3. Review organization membership
4. Check permission settings
5. Verify authentication status

**Contract Signing Issues:**
1. Check DocuSign integration
2. Verify envelope status
3. Resend if needed
4. Check expiration dates
5. Contact DocuSign support if persistent

### Escalation Process

1. **Level 1**: Support team (common issues)
2. **Level 2**: Admin team (complex issues)
3. **Level 3**: Technical team (system issues)
4. **Level 4**: Executive team (critical issues)

---

## Emergency Procedures

### System Outage

1. **Immediate Actions:**
   - Check system status page
   - Verify database connectivity
   - Check third-party services
   - Notify users via status page

2. **Recovery Steps:**
   - Follow rollback plan if needed
   - Restore from backup if data loss
   - Verify all systems operational
   - Test critical workflows

3. **Post-Outage:**
   - Document incident
   - Review logs
   - Identify root cause
   - Implement prevention measures

### Data Breach

1. **Immediate Actions:**
   - Isolate affected systems
   - Preserve logs
   - Notify security team
   - Assess scope

2. **Containment:**
   - Disable affected accounts
   - Reset credentials
   - Review access logs
   - Patch vulnerabilities

3. **Recovery:**
   - Restore from clean backup
   - Verify data integrity
   - Re-enable systems
   - Monitor for anomalies

### Payment Issues

1. **Failed Payments:**
   - Review transaction logs
   - Check Stripe dashboard
   - Verify escrow balance
   - Retry if appropriate
   - Notify parties

2. **Disputed Payments:**
   - Freeze related escrow
   - Review dispute details
   - Investigate thoroughly
   - Resolve per dispute process

3. **Refund Requests:**
   - Verify refund eligibility
   - Check contract terms
   - Process refund if approved
   - Update escrow balance
   - Notify all parties

---

## Best Practices

1. **Documentation**: Always document interventions and decisions
2. **Communication**: Keep users informed of status changes
3. **Audit Trail**: Maintain complete audit trail
4. **Security**: Follow principle of least privilege
5. **Backup**: Regular backups and test restores
6. **Monitoring**: Proactive monitoring and alerting
7. **Training**: Regular training on new features
8. **Feedback**: Collect and act on user feedback

---

## Training Checklist

- [ ] Understand user roles and permissions
- [ ] Can create and manage users
- [ ] Can view and filter projects
- [ ] Understand project status flow
- [ ] Can manage contracts
- [ ] Understand escrow and payment processes
- [ ] Can resolve disputes
- [ ] Can access and review audit logs
- [ ] Understand monitoring dashboard
- [ ] Know escalation procedures
- [ ] Understand emergency procedures
- [ ] Can troubleshoot common issues

---

## Resources

- **Admin Documentation**: Full admin documentation
- **API Documentation**: Swagger UI at `/api/docs`
- **Support Portal**: Internal support ticket system
- **Slack Channel**: #kealee-admin for team communication
- **Weekly Training**: Every Monday at 10 AM

**Questions? Contact the admin team at admin@kealee.com**
