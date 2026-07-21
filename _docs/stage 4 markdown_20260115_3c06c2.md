# PROJECT OWNER HUB - Complete Build Prompts
## Stage 4: Weeks 9-11 | Revenue Stream: $200K-$400K Year 1

### INTEGRATION DEPENDENCIES
- **Requires**: OS Foundation (Stage 1), Ops OS Core (Stage 2), Ops Services (Stage 3)
- **Integrates With**: m-finance-trust (escrow), m-permits-inspections (compliance gates)
- **Data Models**: Project, ContractAgreement, Milestone, Evidence, ReadinessItem

---

## WEEK 9: PROJECT CREATION & READINESS

### Day 1-2: Project Creation Wizard
**Prompt 1.1**: Create a multi-step project creation wizard with:
- Step 1: Basic Info (name, description, category dropdown)
- Step 2: Property Selection (link to existing property or create new)
- Step 3: Budget & Timeline (date pickers, budget input with validation)
- Step 4: Team Selection (add project members with role assignments)
- Step 5: Readiness Checklist Preview
- Progressive saving at each step
- Mobile-responsive design with step indicators
- Breadcrumb navigation with ability to go back

**Prompt 1.2**: Implement property lookup/creation component:
- Address autocomplete using Google Maps API
- Property validation (check for existing projects at same address)
- Property details form (address, city, state, zip, lot details)
- Integration with Property model from OS Foundation
- Error handling for invalid addresses

**Prompt 1.3**: Create project category selector:
- Categories: KITCHEN, BATHROOM, ADDITION, NEW_CONSTRUCTION, RENOVATION, OTHER
- Visual icons for each category
- Category-specific questions (e.g., square footage for additions)
- Save category metadata in project record

### Day 3-4: Readiness Checklist System
**Prompt 1.4**: Build dynamic readiness checklist:
- Admin-configurable checklist items (via os-admin)
- Per-category default checklists
- Required vs optional items clearly marked
- File upload support for documentation
- Completion status tracking
- Automatic email reminders for overdue items

**Prompt 1.5**: Implement readiness gate:
- Project cannot proceed to "READINESS" status until all required items complete
- Visual progress bar showing completion percentage
- Detailed view of incomplete items with assignees
- Bulk completion approval for items
- Audit logging of all completions

**Prompt 1.6**: Create readiness item types:
- Document upload (plans, surveys, HOA approvals)
- Question/answer (yes/no with explanation)
- Date confirmation (schedule confirmations)
- External verification (third-party confirmations)
- Custom items with flexible validation

### Day 5: Testing & Integration
**Prompt 1.7**: Integration tests for project creation:
- Test project creation with all category types
- Test property association validation
- Test readiness checklist generation
- Test permission checks (who can create projects)
- Test error scenarios (duplicate projects, invalid data)

**Prompt 1.8**: Mobile responsiveness testing:
- Test wizard on mobile viewports (320px-768px)
- Touch-friendly form controls
- Optimized file upload on mobile
- Offline capability for step completion

---

## WEEK 10: CONTRACT MANAGEMENT

### Day 1-2: Contract Creation & Templates
**Prompt 2.1**: Build contract template system:
- Admin-managed contract templates (os-admin)
- Template variables (${project.name}, ${owner.name}, etc.)
- WYSIWYG template editor
- Version control for templates
- Preview functionality before use

**Prompt 2.2**: Create contract drafting interface:
- Template selection dropdown
- Variable auto-population from project data
- Rich text editor for custom modifications
- Terms and conditions section
- Milestone definition interface (name, amount, description)
- Automatic total calculation with validation

**Prompt 2.3**: Implement contractor selection:
- Search marketplace contractors by specialty
- Contractor profile preview
- Past performance metrics display
- Available capacity indication
- Invitation system with email notifications

### Day 3-4: DocuSign Integration
**Prompt 2.4**: Integrate DocuSign eSignature:
- Create envelope with all signers (owner, contractor, witnesses)
- Set signing order and requirements
- Embedded signing for in-app experience
- Webhook handling for signature events
- Status synchronization (SENT, VIEWED, SIGNED, COMPLETED)

**Prompt 2.5**: Build signing dashboard:
- Real-time status of all documents
- Reminder system for pending signatures
- Download signed documents (PDF)
- Audit trail of all signing events
- Mobile-optimized signing experience

**Prompt 2.6**: Create contract status management:
- Visual status indicators (DRAFT → SENT → SIGNED → ACTIVE)
- Action buttons based on status
- Automatic escalation for stalled signatures
- Cancellation workflow with reason tracking
- Archive functionality for completed contracts

### Day 5: Testing & Compliance
**Prompt 2.7**: Legal compliance testing:
- Test required disclosures per state
- Test automatic inclusion of statutory language
- Test contract amount validation
- Test signature requirement validation
- Test retention policies for signed documents

**Prompt 2.8**: Security testing:
- Test document access permissions
- Test signature fraud prevention
- Test audit log completeness
- Test data encryption at rest and in transit
- Test GDPR/CCPA compliance for document storage

---

## WEEK 11: MILESTONE MANAGEMENT & CLOSEOUT

### Day 1-2: Milestone Tracking System
**Prompt 3.1**: Build milestone dashboard:
- Visual timeline of all milestones
- Status indicators (PENDING, SUBMITTED, UNDER_REVIEW, APPROVED, PAID)
- Progress percentage calculation
- Upcoming milestone alerts
- Dependency visualization (some milestones require others first)

**Prompt 3.2**: Create milestone submission workflow:
- Contractor submits milestone completion
- Required evidence types per milestone (photos, inspections, documents)
- Bulk file upload with drag-and-drop
- File type validation (images, PDFs, videos)
- Automatic file optimization (image compression, PDF scanning)

**Prompt 3.3**: Implement evidence review interface:
- Side-by-side comparison with requirements
- Commenting system with @mentions
- Approval/Rejection with reason required
- Version history for resubmissions
- Integration with inspection results (auto-approve if inspection passed)

### Day 3-4: Payment Integration & Escrow Gates
**Prompt 3.4**: Create payment approval workflow:
- Owner reviews submitted evidence
- One-click approval triggers escrow release
- Integration with m-finance-trust for payment processing
- Automatic holdback calculation (10% default)
- Email notifications to all parties

**Prompt 3.5**: Build dispute resolution system:
- Dispute initiation with reason and evidence
- Escrow freeze during dispute
- Mediation request system
- Resolution tracking with outcome documentation
- Automatic unfreeze upon resolution

**Prompt 3.6**: Implement permit compliance gates:
- Check permit status before milestone approval
- Block approval if permit expired or invalid
- Show permit status in approval interface
- Link to permit details for resolution
- Automatic alerts for expiring permits

### Day 5: Closeout & Handoff
**Prompt 3.7**: Create project closeout checklist:
- Final inspections completion
- Lien waiver collection
- Punch list resolution
- Final payment processing
- Document archiving

**Prompt 3.8**: Build handoff system:
- Generate project completion package
- Document bundle creation (contracts, permits, inspections, payments)
- Digital handoff to homeowner
- Satisfaction survey integration
- Warranty documentation delivery

### Day 6: Final Testing & Launch
**Prompt 3.9**: End-to-end testing:
- Test complete project lifecycle (creation to closeout)
- Test all integration points (finance, permits, marketplace)
- Test error recovery scenarios
- Test performance under load (100+ concurrent projects)
- Test data migration from previous systems

**Prompt 3.10**: Launch preparation:
- User onboarding flow creation
- Help documentation writing
- Admin training materials
- Monitoring dashboard setup
- Rollback plan documentation

---

## ACCESSIBILITY REQUIREMENTS (All Components)

**WCAG 2.1 AA Compliance:**
- All form controls must have proper labels and ARIA attributes
- Color contrast ratio of at least 4.5:1 for normal text
- Keyboard navigation must be fully functional
- Screen reader announcements for all status changes
- Focus management for modal dialogs and wizards
- Error identification with both color and text
- Resizable text up to 200% without loss of functionality

## PERFORMANCE TARGETS

**Lighthouse Scores:**
- Performance: ≥ 90
- Accessibility: ≥ 95  
- Best Practices: ≥ 90
- SEO: ≥ 90

**Load Times:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Page Load Complete: < 5s

**Database Performance:**
- API Response Time: < 200ms (95th percentile)
- Concurrent Users: Support 500+ simultaneous users
- Data Export: < 30s for 10,000 records

## SECURITY REQUIREMENTS

**Data Protection:**
- Encrypt all PII at rest and in transit
- Implement role-based access control for all data
- Audit logging for all data access and modifications
- Regular security scanning and penetration testing

**Compliance:**
- GDPR data portability and deletion
- CCPA consumer rights fulfillment
- HIPAA compliance for medical facility projects
- PCI DSS compliance for payment processing

## MONITORING & ANALYTICS

**Required Metrics:**
- User adoption rate by feature
- Project creation completion rate
- Contract signing success rate
- Milestone approval time averages
- User satisfaction scores (NPS/CSAT)

**Alerting:**
- System errors: Immediate notification
- Performance degradation: 15-minute threshold
- Security events: Real-time alerts
- Business metric anomalies: Daily reports

---

## INTEGRATION CHECKLIST

Before Week 11 completion, verify:
✅ Project creation integrates with Property model
✅ Readiness checklist pulls from admin configuration  
✅ Contract signing updates project status automatically
✅ Milestone approval triggers escrow release in m-finance-trust
✅ Permit status blocks milestone approval when expired
✅ All data syncs correctly to os-admin for oversight
✅ Mobile responsiveness tested on iOS and Android
✅ Accessibility audit completed with zero critical issues
✅ Performance testing completed with target metrics met
✅ Security review completed with no high-risk vulnerabilities

---

## WEEK 11 LAUNCH DELIVERABLES

1. **Fully Functional Project Owner Hub** with all features
2. **Complete API Documentation** for all endpoints
3. **User Guide** for homeowners and contractors
4. **Admin Manual** for platform administrators
5. **Integration Test Suite** with 95%+ coverage
6. **Monitoring Dashboard** for production oversight
7. **Rollback Plan** for emergency scenarios
8. **First 5 Beta Projects** onboarded and active

---

**Next Step**: After Project Owner Hub launch, immediately begin Finance & Trust Hub (Week 12) to enable payment processing for approved milestones.