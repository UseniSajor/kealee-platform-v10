# Architect Hub Integration Testing Guide
## Prompt 2.9: Complete Integration Testing

**Date:** January 2026  
**Purpose:** Comprehensive integration testing for Architect Hub features and workflows

---

## 📋 TESTING OVERVIEW

This document outlines the integration testing strategy for the Architect Hub module, covering:
- Handoff to m-permits-inspections with various project types
- Collaboration with m-engineer for structural coordination
- Version control under heavy concurrent usage
- Large file handling (100MB+ models)
- Offline capability for field reviews
- Mobile responsiveness for site visits

---

## 🧪 TEST SUITES

### 1. **Architect Hub Integration Tests**
**File:** `services/api/src/__tests__/architect-integration.test.ts`

**Coverage:**
- ✅ Design project creation and linking
- ✅ Drawing set and deliverable workflows
- ✅ Version control and revision management
- ✅ Validation and approval workflows
- ✅ Stamp and permit package workflows
- ✅ Quality control and construction handoff
- ✅ Route structure validation

**Test Cases:**
- Design project creation with Project Owner linking
- Drawing set creation with multiple sheets
- Deliverable tracking and status updates
- Version branch creation and merging
- Revision creation and tracking
- Validation rule creation and execution
- Approval workflow creation and execution
- Stamp template creation and application
- Permit package auto-generation
- QC checklist creation
- IFC package generation

### 2. **Handoff Integration Tests**
**File:** `services/api/src/__tests__/architect-handoff-integration.test.ts`

**Coverage:**
- ✅ Handoff to m-permits-inspections
- ✅ Collaboration with m-engineer
- ✅ Cross-module data flow

**Test Cases:**
- Permit package submission to m-permits-inspections
- Different project types (RESIDENTIAL, COMMERCIAL, INSTITUTIONAL, MIXED_USE)
- Permit package status sync from permit system
- Structural coordination with engineer drawings
- Multi-discipline drawing set coordination

### 3. **Performance Tests**
**File:** `services/api/src/__tests__/architect-performance.test.ts`

**Coverage:**
- ✅ Version control concurrent usage
- ✅ Large file handling
- ✅ Response time benchmarks

**Test Cases:**
- Concurrent version creation (10+ simultaneous)
- Concurrent branch creation (5+ simultaneous)
- Concurrent version comparisons (20+ simultaneous)
- Large file metadata handling (100MB+)
- Multiple large file references
- Response time benchmarks (< 1 second)
- Rapid request handling (50+ requests)

### 4. **Mobile and Offline Tests**
**File:** `apps/m-architect/__tests__/mobile-offline.test.ts`

**Coverage:**
- ✅ Mobile responsiveness
- ✅ Offline capability
- ✅ Field review capabilities

**Test Cases:**
- Mobile viewport rendering (375x667, 768x1024)
- Touch interaction handling
- Offline data caching
- Action queuing when offline
- Automatic sync when back online
- Photo upload from mobile
- GPS location capture
- Voice-to-text for notes

---

## 🚀 RUNNING TESTS

### API Integration Tests

```bash
# From services/api directory
cd services/api

# Run all architect integration tests
pnpm test architect-integration

# Run handoff integration tests
pnpm test architect-handoff-integration

# Run performance tests
pnpm test architect-performance

# Run all tests with coverage
pnpm test:coverage
```

### Frontend Mobile/Offline Tests

```bash
# From apps/m-architect directory
cd apps/m-architect

# Run Playwright tests
pnpm test:e2e

# Run with mobile viewports
pnpm test:e2e --project=mobile

# Run offline tests
pnpm test:e2e --project=offline
```

---

## 📊 TEST SCENARIOS

### Scenario 1: Complete Design-to-Permit Workflow

**Steps:**
1. Create design project
2. Create drawing set with multiple sheets
3. Approve drawings
4. Generate permit package
5. Submit to m-permits-inspections
6. Sync status from permit system
7. Handle review comments

**Expected Results:**
- All steps complete successfully
- Data flows correctly between modules
- Status updates propagate correctly

### Scenario 2: Multi-Discipline Coordination

**Steps:**
1. Architect creates architectural drawings
2. Engineer creates structural drawings
3. Both reference each other's work
4. Coordinate revisions
5. Generate combined IFC package

**Expected Results:**
- Cross-discipline references work
- Revision coordination functions
- Combined packages assemble correctly

### Scenario 3: Concurrent Version Control

**Steps:**
1. Multiple users create versions simultaneously
2. Create branches concurrently
3. Perform version comparisons in parallel
4. Merge branches with conflicts

**Expected Results:**
- No data corruption
- All operations complete
- Conflicts resolved correctly

### Scenario 4: Large File Handling

**Steps:**
1. Upload 100MB+ BIM model
2. Upload multiple large models
3. Generate views from large models
4. Compare large model versions

**Expected Results:**
- Files upload successfully
- Operations complete without timeout
- Performance remains acceptable

### Scenario 5: Offline Field Review

**Steps:**
1. Load project data while online
2. Go offline
3. Create review comments
4. Upload photos with GPS
5. Go back online
6. Verify sync

**Expected Results:**
- Data cached for offline access
- Actions queued when offline
- Automatic sync when online
- All data preserved

### Scenario 6: Mobile Site Visit

**Steps:**
1. Access project on mobile device
2. View drawings on mobile
3. Create review comments
4. Capture photos with GPS
5. Use voice-to-text for notes

**Expected Results:**
- UI renders correctly on mobile
- Touch interactions work
- All features accessible
- Performance acceptable

---

## 🔍 TESTING CHECKLIST

### Design Project Management
- [ ] Create design project
- [ ] Link to Project Owner project
- [ ] Create design phases
- [ ] Add team members
- [ ] Update project status

### Drawing Sets
- [ ] Create drawing set
- [ ] Add drawing sheets
- [ ] Update sheet status
- [ ] Generate PDF set
- [ ] Track revisions

### Deliverables
- [ ] Create deliverable
- [ ] Track deliverable status
- [ ] Create deliverable package
- [ ] Link to milestones

### Version Control
- [ ] Create version branch
- [ ] Create design version
- [ ] Compare versions
- [ ] Merge branches
- [ ] Rollback to version
- [ ] Handle concurrent operations

### Revisions
- [ ] Create revision
- [ ] Add sheets to revision
- [ ] Generate revision schedule
- [ ] Track revision impact
- [ ] Archive revisions

### Design Validation
- [ ] Create validation rule
- [ ] Run validation
- [ ] Generate validation report
- [ ] Create drawing checklist
- [ ] Validate code compliance

### Approval Workflows
- [ ] Create approval workflow
- [ ] Create approval request
- [ ] Approve/reject steps
- [ ] Delegate approval
- [ ] Generate approval certificate

### Architect Stamps
- [ ] Create stamp template
- [ ] Validate license
- [ ] Apply stamp
- [ ] Verify stamp application
- [ ] Check tampering

### Quality Control
- [ ] Create QC checklist
- [ ] Perform random sample check
- [ ] Report QC error
- [ ] Create corrective action
- [ ] Calculate QC metrics

### Permit Packages
- [ ] Auto-generate permit package
- [ ] Calculate permit fees
- [ ] Submit to permit system
- [ ] Sync permit status
- [ ] Handle review comments

### Construction Handoff
- [ ] Generate IFC package
- [ ] Issue IFC package
- [ ] Generate bid package
- [ ] Create contractor question
- [ ] Create RFI
- [ ] Create submittal
- [ ] Create as-built documentation

---

## 📈 PERFORMANCE BENCHMARKS

### Response Time Targets
- **Simple queries:** < 200ms
- **Complex queries:** < 500ms
- **File operations:** < 1s
- **Large file uploads:** < 30s (100MB)
- **Concurrent operations:** < 2s (10 concurrent)

### Throughput Targets
- **Concurrent users:** 50+
- **Concurrent operations:** 100+
- **Large files:** 100MB+ models
- **Version comparisons:** 20+ concurrent

### Resource Usage
- **Memory:** < 512MB per request
- **CPU:** < 50% during peak load
- **Database connections:** < 20 concurrent

---

## 🐛 KNOWN LIMITATIONS

### Current Test Coverage
- ✅ Route structure validation
- ✅ Payload validation
- ✅ Authentication checks
- ⚠️ Full database integration (requires test DB)
- ⚠️ File upload testing (requires file system)
- ⚠️ Real-time collaboration (requires WebSocket)

### Mocking Requirements
- Supabase Auth (for authentication tests)
- Database (for integration tests)
- File storage (for file upload tests)
- External APIs (for permit system integration)

---

## 🔄 CONTINUOUS INTEGRATION

### CI/CD Pipeline Integration

```yaml
# Example GitHub Actions workflow
name: Architect Hub Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:architect
      - run: pnpm test:coverage
```

### Test Environment Setup
1. **Test Database:** Separate PostgreSQL instance
2. **Test Storage:** Local file system or test S3 bucket
3. **Mock Services:** Mock Supabase, external APIs
4. **Test Data:** Seeded test projects, users, drawings

---

## 📝 TEST DATA

### Test Projects
- Residential project (single-family home)
- Commercial project (office building)
- Institutional project (school)
- Mixed-use project (residential + commercial)

### Test Users
- Principal architect
- Project architect
- Designer
- Drafter
- Client
- Engineer (for coordination)

### Test Drawings
- Small set (5-10 sheets)
- Medium set (20-30 sheets)
- Large set (50+ sheets)
- Multi-discipline set (A, S, M, E)

### Test Files
- Small PDFs (< 1MB)
- Medium PDFs (1-10MB)
- Large PDFs (10-50MB)
- BIM models (50-150MB)

---

## ✅ TESTING CHECKLIST

### Pre-Launch Testing
- [ ] All integration tests pass
- [ ] Performance benchmarks met
- [ ] Mobile responsiveness verified
- [ ] Offline capability tested
- [ ] Cross-module integrations working
- [ ] Error handling tested
- [ ] Security validation passed
- [ ] Load testing completed

### Post-Launch Monitoring
- [ ] Monitor API response times
- [ ] Track error rates
- [ ] Monitor database performance
- [ ] Track file upload success rates
- [ ] Monitor concurrent usage
- [ ] Track user feedback

---

## 🚨 TROUBLESHOOTING

### Common Issues

**Tests fail with authentication errors:**
- Mock Supabase Auth in test environment
- Use test tokens for authenticated requests

**Tests fail with database errors:**
- Set up test database
- Run migrations on test database
- Seed test data

**Performance tests timeout:**
- Increase timeout values
- Optimize database queries
- Add database indexes

**Mobile tests fail:**
- Verify viewport sizes
- Check touch event handlers
- Verify responsive CSS

---

**Last Updated:** January 2026  
**Next Review:** After Stage 7 completion
