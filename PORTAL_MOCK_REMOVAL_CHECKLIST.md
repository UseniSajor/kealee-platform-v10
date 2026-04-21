# PORTAL MOCK DATA REMOVAL — IMPLEMENTATION CHECKLIST

**Status**: ⏳ Ready for implementation
**Files to patch**: 5 pages across 3 portals
**Total mock objects**: ~160+
**Estimated effort**: 3-4 hours

---

## ✅ PORTAL-CONTRACTOR

### 1. bids/page.tsx — PURE MOCK (CRITICAL)

**Current state**: 6 hardcoded bids, no API call
**Lines to remove**:
- Lines 7-18: `CSI_DIVISIONS` (move to lib/)
- Lines 21-29: `PAYMENT_MILESTONES` (move to lib/)
- Lines 31-35: `twinTierLabels` (move to lib/)
- Lines 57-238: `const BIDS: Bid[]` (ENTIRE BLOCK)

**Replace with**:
```typescript
'use client'
import { useEffect, useState } from 'react'
import { useAuthToken } from '@/hooks/useAuth'

export default function BidsPage() {
  const token = useAuthToken()
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchBids = async () => {
      if (!token) return
      try {
        const res = await fetch('/api/v1/contractor/bids', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to load bids')
        const data = await res.json()
        setBids(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchBids()
  }, [token])

  if (loading) return <BidsSkeleton />
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />

  const filtered = filter === 'all' ? bids : bids.filter(b => b.status === filter)

  // ... rest of JSX (no changes)
}
```

**API endpoint needed**: `GET /api/v1/contractor/bids`
- Response: `Bid[]` with CSI breakdown + milestone schedule
- Auth: Required (JWT bearer token)

**Components to add**:
- `<BidsSkeleton />` - 6 placeholder cards while loading
- `<ErrorMessage />` - Error display with retry button

**Shared constants** (move to `lib/constants.ts`):
- `CSI_DIVISIONS`
- `PAYMENT_MILESTONES`
- `twinTierLabels`

---

### 2. payments/page.tsx — HYBRID (MEDIUM)

**Current state**: Seed fallback exists, but API integration incomplete
**Lines to verify**:
- Line 39-79: `SEED_PROJECT_PAYMENTS` (currently fallback)
- Line 140-171: Has API attempt but uses `getProjectMilestones()` incorrectly

**Replace with**:
```typescript
const [projectPayments, setProjectPayments] = useState<ProjectPayment[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  const fetchPayments = async () => {
    try {
      const projects = await listProjects() // existing function
      const allMilestones = []

      for (const project of projects) {
        const milestones = await getProjectMilestones(project.id)
        allMilestones.push(...milestones)
      }

      setProjectPayments(allMilestones)
    } catch (err) {
      console.error('Failed to load payments:', err)
      setProjectPayments([]) // Don't fallback to seed
    } finally {
      setLoading(false)
    }
  }
  fetchPayments()
}, [])
```

**Action**:
- Remove `SEED_PROJECT_PAYMENTS` constant entirely
- Ensure `getProjectMilestones()` is imported from `@/lib/api`
- Add error handling that doesn't hide API failures

---

## ✅ PORTAL-OWNER

### 3. documents/page.tsx — HYBRID (MEDIUM)

**Current state**: Seed data + API augmentation
**Lines to change**:
- Lines 18-95: `PERMIT_CATEGORIES` (keep but enhance with API data)
- Lines 109-147: `DOCUMENTS` (REMOVE)
- Line 205: `useState(DOCUMENTS)` → `useState([])`

**Replace with**:
```typescript
const [documents, setDocuments] = useState<Document[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  const fetchDocuments = async () => {
    try {
      const files = await listFiles(`/projects/${projectId}/documents`)

      // Enhance with permit metadata
      const enriched = files.map(f => ({
        ...f,
        category: inferCategory(f.name),
        permitType: inferPermitType(f.tags),
        status: 'uploaded' // default
      }))

      setDocuments(enriched)
    } catch (err) {
      console.error('Failed to load documents:', err)
    } finally {
      setLoading(false)
    }
  }
  fetchDocuments()
}, [projectId])
```

**API endpoint needed**: `GET /api/v1/files?folder={projectId}/documents`
- Response: File[] with metadata

**Action**:
- Remove `const DOCUMENTS` entirely (lines 109-147)
- Keep `PERMIT_CATEGORIES` (config, not mock data)
- Call real file API with enrichment logic

---

## ✅ PORTAL-DEVELOPER

### 4. capital/page.tsx — HYBRID (MEDIUM)

**Current state**: `CAPITAL_STACKS` + `DRAW_SCHEDULE` as seed with API fallback
**Lines to change**:
- Lines 18-69: `CAPITAL_STACKS` (REMOVE)
- Lines 72-82: `DRAW_SCHEDULE` (REMOVE)
- Lines 92-99: `INVESTOR_SUMMARY` (REMOVE)

**Replace with**:
```typescript
const [stacks, setStacks] = useState<CapitalStack[]>([])
const [draws, setDraws] = useState<Draw[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  const fetchCapitalData = async () => {
    try {
      const res = await fetch('/api/v1/projects?includeFinance=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error()

      const projects = await res.json()

      // Transform to capital stacks + draws
      const capitalStacks = projects.map(p => ({
        id: p.id,
        project: p.name,
        projectType: p.type,
        sources: p.capitalStack // from API response
      }))

      const draws = projects.flatMap(p => p.draws || [])

      setStacks(capitalStacks)
      setDraws(draws)
    } catch (err) {
      console.error('Failed to load capital data:', err)
    } finally {
      setLoading(false)
    }
  }
  fetchCapitalData()
}, [token])
```

**API endpoints needed**:
- `GET /api/v1/projects?includeFinance=true` (existing, used line 112)
- Response must include: `capitalStack[]`, `draws[]`

**Action**:
- Remove hardcoded seed data (lines 18-99)
- Use existing API call pattern (line 112)
- Transform API response to component data structures

---

### 5. feasibility/page.tsx — SEED FALLBACK (LOW)

**Current state**: `STUDIES` seed data used directly
**Action**:
- Add similar fetch pattern as capital/page
- Call `GET /api/v1/feasibility-studies` (or map to projects endpoint)
- Remove seed constants

---

## 🔧 SKELETON/LOADING COMPONENTS TO CREATE

Add to `portal-*/components/ui/`:

### BidsSkeleton.tsx
```typescript
export function BidsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  )
}
```

### DocumentsSkeleton.tsx
```typescript
export function DocumentsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-32 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  )
}
```

### CapitalStackSkeleton.tsx
```typescript
// Similar pattern: grid of skeleton cards
```

---

## 🎯 IMPLEMENTATION ORDER

1. **Shared constants** — Move `CSI_DIVISIONS`, `PAYMENT_MILESTONES`, `twinTierLabels` to `lib/constants.ts`
2. **Skeleton components** — Create `components/ui/Skeletons.tsx`
3. **bids/page.tsx** — Replace BIDS with API call (HIGHEST IMPACT)
4. **payments/page.tsx** — Complete API integration
5. **documents/page.tsx** — Fetch from file API
6. **capital/page.tsx** — Use existing `?includeFinance=true` query
7. **feasibility/page.tsx** — Fetch studies

---

## ✅ VERIFICATION CHECKLIST

After each patch, verify:
- [ ] Page loads without errors
- [ ] Loading skeleton shows briefly
- [ ] Real data displays from API (or error message)
- [ ] No hardcoded `const MOCK_*` or `const SEED_*` remains
- [ ] Filter/sorting works with API data
- [ ] Error state handles API failures gracefully
- [ ] Refresh page → data reloads correctly
- [ ] Auth token is properly injected

---

## 📋 API ENDPOINTS REQUIRED

These must exist or be created in `services/api`:

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/v1/contractor/bids` | GET | List bids for contractor | ❌ CREATE |
| `/api/v1/projects?includeFinance=true` | GET | Projects with capital data | ✅ EXISTS |
| `/api/v1/files?folder=...` | GET | File listing with metadata | ✅ EXISTS |
| `/api/v1/feasibility-studies` | GET | Feasibility analysis records | ❌ CREATE |
| `/api/v1/projects/:id/milestones` | GET | Payment milestones | ✅ EXISTS |

---

## 🚀 SUCCESS CRITERIA

**Before**: Mock data hardcoded in components, real API calls fail silently
**After**:
- ✅ Real API data loading
- ✅ Loading states visible
- ✅ Error messages shown
- ✅ No mock data in component code
- ✅ Zero console errors
- ✅ Auth properly injected

