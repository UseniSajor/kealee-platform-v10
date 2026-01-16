# ARCHITECT HUB - Complete Build Prompts
## Stage 7: Weeks 18-19 | Revenue Stream: $50K-$150K Year 1

### INTEGRATION DEPENDENCIES
- **Requires**: Project Owner Hub (Stage 4) for project context
- **Integrates With**: m-permits-inspections (design handoff), m-engineer (collaboration)
- **Data Models**: Project (extended), DesignDeliverable, ReviewComment, Version

---

## WEEK 18: DESIGN PROJECT MANAGEMENT & DELIVERABLES

### Day 1-2: Design Project Creation & Structure
**Prompt 1.1**: Create architect project workspace:
- Project setup wizard linking to existing Project Owner projects
- Project type categorization (Residential, Commercial, Institutional, Mixed-Use)
- Phase definition (Pre-Design, Schematic Design, Design Development, Construction Documents)
- Team assignment with role-based permissions (Principal, Project Architect, Designer, Drafter)
- Client access portal for review and feedback
- Integration with project budget and timeline from Project Owner

**Prompt 1.2**: Implement design phase management:
- Phase gate system with approval workflows
- Phase-specific deliverables checklist
- Automatic phase progression triggers
- Phase duration tracking with alerts for delays
- Phase completion documentation and sign-off
- Historical phase timeline visualization

**Prompt 1.3**: Build file management system for design documents:
- Folder structure mirroring AIA document organization
- File versioning with automatic incrementing
- Check-in/check-out system for collaboration
- File locking during editing
- Bulk upload with automatic file type detection
- File preview for common formats (PDF, DWG, RVT, SKP)

### Day 3-4: Deliverable Management System
**Prompt 1.4**: Create deliverable tracking system:
- Deliverable types: Drawings, Specifications, Reports, Calculations, Models
- Status tracking (Draft, In Review, Approved, Issued, Revised)
- Due date management with dependency relationships
- Automatic notification to team members when deliverables are ready
- Integration with project milestone schedule
- Deliverable package assembly for client submissions

**Prompt 1.5**: Implement drawing set management:
- Sheet index management with automatic numbering
- Discipline organization (A-Architectural, S-Structural, M-Mechanical, etc.)
- Sheet status tracking (Started, In Progress, Checked, Approved)
- Revision cloud tracking with revision history
- Title block data auto-population
- PDF generation with proper layer organization

**Prompt 1.6**: Build 3D/BIM model integration:
- Model viewing interface for common formats (RVT, IFC, SKP)
- Model slicing for plan/section/elevation generation
- Component property viewing and editing
- Clash detection integration (basic visualization)
- Model comparison between versions
- Lightweight web viewer for client reviews

### Day 5: Collaboration & Review System
**Prompt 1.7**: Create design review workflow:
- Review request creation with specific deliverables
- Reviewer assignment (internal team, client, consultant)
- Review deadline setting with reminders
- Commenting system with mark-up tools
- Comment status tracking (Open, Addressed, Closed)
- Review completion approval process

**Prompt 1.8**: Implement real-time collaboration tools:
- Live document viewing with presence indicators
- Comment threads with @mentions
- Change tracking with visual diff
- Approval workflows with digital signatures
- Meeting minute integration with action items
- Design decision log with supporting documentation

---

## WEEK 19: VERSION CONTROL, APPROVAL & HANDOFF

### Day 1-2: Professional Version Control System
**Prompt 2.1**: Build enterprise-grade version control:
- Git-like branching for experimental designs
- Merge conflict resolution for collaborative editing
- Version tagging for major milestones (SD, DD, CD, Bid, Construction)
- Version comparison with visual diff for drawings
- Rollback capability to any previous version
- Version notes with change descriptions

**Prompt 2.2**: Create revision management:
- Revision cloud tracking across sheet sets
- Revision schedule auto-generation
- Revision issuance tracking (Prelim, Addendum, Change Order)
- Revision impact analysis on other disciplines
- Revision approval workflow
- Historical revision archive with search

**Prompt 2.3**: Implement design validation system:
- Automated drawing checklist (title block, scale, north arrow, etc.)
- Code compliance checklist integration
- Accessibility standard verification (ADA, ANSI A117.1)
- Building code cross-reference system
- Energy code compliance tracking
- Validation report generation

### Day 3-4: Approval Workflows & Stamping
**Prompt 2.4**: Create professional approval system:
- Multi-tier approval workflow (Drafter → Project Architect → Principal)
- Conditional approval paths based on project type
- Approval delegation with audit trail
- Electronic signature integration (DocuSign for professional seals)
- Approval certificate generation
- Approval history with timestamp and IP logging

**Prompt 2.5**: Implement architect stamp workflow:
- Digital seal management (upload, verification, expiration tracking)
- Stamp placement interface with positioning tools
- Multiple stamp types (Architect, Landscape Architect, Interior Designer)
- State license validation integration
- Stamp log with usage tracking
- Tamper-evident stamp application

**Prompt 2.6**: Build quality control system:
- Quality control checklist per project phase
- Random sample checking algorithm
- Error categorization and tracking
- Corrective action tracking
- Quality metrics dashboard
- Continuous improvement feedback loop

### Day 5: Handoff to Permits & Construction
**Prompt 2.7**: Create automatic permit package generation:
- Extract permit-required drawings from full set
- Auto-generate permit application forms
- Calculate permit fees based on jurisdiction schedules
- Package assembly with cover sheet and index
- Submit to m-permits-inspections via API
- Track submission status and review comments

**Prompt 2.8**: Implement construction administration handoff:
- Issue for Construction (IFC) package generation
- Bid package assembly with specifications
- Contractor question/answer management
- Submittal tracking during construction
- RFI (Request for Information) management
- As-built documentation collection

### Day 6: Integration & Launch Preparation
**Prompt 2.9**: Complete integration testing:
- Test handoff to m-permits-inspections with various project types
- Test collaboration with m-engineer for structural coordination
- Test version control under heavy concurrent usage
- Test large file handling (100MB+ models)
- Test offline capability for field reviews
- Test mobile responsiveness for site visits

**Prompt 2.10**: Launch preparation:
- Architect onboarding workflow creation
- Template library setup (details, schedules, sheets)
- Standard detail library integration
- Training materials for design teams
- Performance benchmarking for large projects
- Backup and disaster recovery procedures

---

## ACCESSIBILITY REQUIREMENTS

**Professional Interface Standards:**
- Keyboard navigation for all design tools
- Screen reader compatibility for document management
- High contrast mode for drawing review
- Zoom support up to 400% without loss of functionality
- Alternative text for all visual elements
- Time-based media alternatives for walkthroughs

**Design File Accessibility:**
- PDF/UA compliance for generated documents
- Alt text for drawing elements
- Semantic structure for complex drawings
- Color-blind friendly palette for review markups
- Text extraction from scanned documents
- Navigation aids for large drawing sets

## PERFORMANCE TARGETS

**File Processing:**
- PDF rendering: < 3 seconds for 100-page sets
- DWG viewing: < 5 seconds for complex drawings
- Model loading: < 10 seconds for 50MB models
- Version comparison: < 2 seconds for 10 versions
- Search indexing: < 30 seconds for 10,000 drawings

**Collaboration Performance:**
- Real-time sync: < 1 second for markups
- Comment loading: < 500ms for 100+ comments
- Presence updates: < 500ms latency
- Notification delivery: < 2 seconds
- Mobile sync: Efficient delta updates

**Scalability:**
- Support 500+ concurrent design sessions
- Handle 10,000+ drawing versions
- Process 1TB+ of design files
- Support 100+ simultaneous live collaborations
- Maintain performance during firm-wide usage

## SECURITY REQUIREMENTS

**Professional Data Protection:**
- AES-256 encryption for all design files
- Watermarking for sensitive drawings
- Access logging with forensic capabilities
- IP restriction for client access
- Download controls with expiration
- Print restrictions for confidential projects

**Compliance Requirements:**
- AIA document retention policies
- State architect board regulations
- Professional liability insurance integration
- Error and omission tracking
- Audit trail for all design decisions
- Digital signature chain of custody

## INTEGRATION CHECKLIST

Before Week 19 completion, verify:
✅ Design projects link correctly to Project Owner projects
✅ Deliverable versions sync with project phases
✅ Review comments integrate with team collaboration
✅ Approval workflows include proper stamping
✅ Handoff to m-permits-inspections works automatically
✅ Integration with m-engineer for coordination
✅ All architect data accessible in os-admin
✅ Mobile tools work for site visits and client meetings
✅ Accessibility requirements met for professional use
✅ Performance targets achieved with large files
✅ Security measures protect intellectual property

---

## WEEK 19 LAUNCH DELIVERABLES

1. **Production-Ready Architect Hub** with full design management
2. **Version Control System** for professional drawings
3. **Approval Workflow Engine** with stamp integration
4. **Permit Handoff Automation** to m-permits-inspections
5. **Collaboration Tools** for design teams
6. **Quality Control System** with checklists
7. **Integration Test Suite** for all workflows
8. **Architect Onboarding Materials**
9. **Template Library** with standard details
10. **First 5 Design Projects** migrated and active

---

**Next Step**: After Architect Hub launch, immediately begin Permits & Inspections Hub (Week 19-20) - the largest new revenue stream.