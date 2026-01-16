# m-inspector vs m-permits-inspections - Key Differences

## Overview

These are **two separate applications** serving different purposes in the Kealee Platform:

1. **`m-inspector`** - Mobile app for field inspectors (React Native)
2. **`m-permits-inspections`** - Web platform for permits & inspections management (Next.js)

---

## m-inspector (Mobile App)

### Purpose
**Field inspection app** - Used by inspectors while physically on construction sites

### Technology
- **Framework**: React Native 0.73
- **Platform**: iOS & Android native apps
- **Deployment**: App Store / Google Play Store
- **Target Users**: Field inspectors (mobile workers)

### Key Features
- ✅ **Offline-first** - Works without internet connection
- ✅ **Photo capture** with GPS tagging
- ✅ **Sketch tools** for field diagrams
- ✅ **Voice-to-text** notes
- ✅ **Digital signatures** collection
- ✅ **Barcode/QR scanning** for permit verification
- ✅ **Route optimization** for daily inspections
- ✅ **Biometric authentication** (Face ID, Touch ID)
- ✅ **Background sync** when connectivity available

### Use Cases
- Inspector arrives at construction site
- Opens mobile app (works offline)
- Completes inspection checklist
- Takes photos with GPS coordinates
- Draws sketches of issues
- Records voice notes
- Collects contractor signatures
- Syncs data when back online

### File Location
```
apps/m-inspector/
├── App.tsx                    # React Native app entry
├── src/
│   ├── screens/               # Mobile screens
│   │   ├── InspectionListScreen.tsx
│   │   ├── InspectionDetailScreen.tsx
│   │   └── RouteScreen.tsx
│   ├── components/            # Mobile components
│   │   ├── PhotoCapture.tsx
│   │   ├── SketchCanvas.tsx
│   │   └── SignatureCapture.tsx
│   └── services/              # Mobile services
│       ├── storage.ts          # AsyncStorage
│       ├── sync.ts            # Offline sync
│       └── location.ts        # GPS
```

---

## m-permits-inspections (Web Platform)

### Purpose
**Permits & Inspections Hub** - Complete web-based platform for managing permits and inspections

### Technology
- **Framework**: Next.js 14 (App Router)
- **Platform**: Web browser (desktop/tablet)
- **Deployment**: Vercel / Cloud hosting
- **Target Users**: 
  - Jurisdiction staff (admins, reviewers, coordinators)
  - Contractors
  - Property owners
  - Public users

### Key Features
- ✅ **Jurisdiction management** - Multi-jurisdiction SaaS platform
- ✅ **Permit application portal** - Online permit submissions
- ✅ **Digital plan review** - PDF markup and collaboration
- ✅ **Inspection scheduling** - Calendar and routing
- ✅ **Staff management** - Role-based permissions, workload balancing
- ✅ **Video inspections** - WebRTC-based remote inspections
- ✅ **AI video analysis** - Object detection, defect detection, measurements
- ✅ **Public portal** - Transparency and citizen access
- ✅ **Analytics & reporting** - Performance metrics, revenue tracking

### Use Cases
- **Jurisdiction Admin**: Manage staff, configure fees, view analytics
- **Plan Reviewer**: Review permit applications, mark up PDFs, approve/reject
- **Permit Coordinator**: Process applications, issue permits, manage documents
- **Contractor**: Submit permit applications, track status, view results
- **Public**: Search permits, view inspection results, submit comments

### File Location
```
apps/m-permits-inspections/
├── src/
│   ├── app/                   # Next.js pages
│   │   ├── dashboard/         # Admin dashboard
│   │   │   ├── permits/       # Permit management
│   │   │   ├── inspections/  # Inspection management
│   │   │   ├── reviews/       # Plan review
│   │   │   ├── jurisdiction/ # Staff management
│   │   │   └── video-inspections/ # Remote inspections
│   │   └── api/              # API routes
│   ├── components/            # Web components
│   │   ├── permit/           # Permit UI
│   │   ├── inspection/       # Inspection UI
│   │   ├── reviews/           # Review tools
│   │   └── video-inspection/ # Video inspection UI
│   └── services/              # Business logic
│       ├── jurisdiction-staff/ # Staff management
│       └── video-inspection/  # Video inspection
```

---

## Key Differences Summary

| Aspect | m-inspector | m-permits-inspections |
|--------|-------------|----------------------|
| **Type** | Mobile app (iOS/Android) | Web application |
| **Framework** | React Native | Next.js |
| **Primary Users** | Field inspectors | Jurisdiction staff, contractors, public |
| **Use Case** | On-site inspections | Permit management, reviews, scheduling |
| **Connectivity** | Offline-first | Online (with some offline features) |
| **Deployment** | App stores | Web hosting |
| **Device** | Smartphone/tablet | Desktop/tablet browser |
| **Focus** | Field data collection | Administrative management |
| **Features** | Camera, GPS, sketches, voice | PDF review, scheduling, analytics |

---

## How They Work Together

```
┌─────────────────────────────────────┐
│  m-permits-inspections (Web)        │
│  - Jurisdiction staff schedules     │
│    inspections                      │
│  - Assigns to inspectors            │
│  - Reviews inspection results       │
└──────────────┬──────────────────────┘
               │
               │ API Sync
               │
┌──────────────▼──────────────────────┐
│  m-inspector (Mobile)                │
│  - Inspector downloads daily         │
│    inspection list                  │
│  - Performs inspections offline     │
│  - Syncs results when online        │
└─────────────────────────────────────┘
```

### Workflow Example

1. **In Office (Web Platform)**:
   - Permit Coordinator creates inspection request in `m-permits-inspections`
   - System assigns to inspector using workload balancer
   - Inspector receives notification

2. **In Field (Mobile App)**:
   - Inspector opens `m-inspector` app
   - Downloads inspection checklist (works offline)
   - Drives to site, performs inspection
   - Takes photos, records notes, collects signatures
   - All data stored locally

3. **Back Online (Sync)**:
   - App syncs inspection data to `m-permits-inspections` platform
   - Results appear in web dashboard
   - Contractor notified of results
   - Permit status updated

---

## Technology Stack Comparison

### m-inspector (React Native)
```json
{
  "react-native": "0.73.0",
  "@react-navigation/native": "^6.1.9",
  "@react-native-async-storage/async-storage": "^1.21.0",
  "react-native-camera": "^4.2.1",
  "react-native-maps": "^1.10.0",
  "react-native-biometrics": "^3.0.1"
}
```

### m-permits-inspections (Next.js)
```json
{
  "next": "^14.0.4",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@tensorflow/tfjs": "^4.15.0",
  "simple-peer": "^9.11.1",
  "recordrtc": "^5.6.2"
}
```

---

## When to Use Which

### Use m-inspector when:
- ✅ Inspector is physically on a construction site
- ✅ Need to work without internet connection
- ✅ Need to use phone camera, GPS, or other mobile sensors
- ✅ Need mobile-optimized UI for field work
- ✅ Need offline data collection

### Use m-permits-inspections when:
- ✅ Managing permits and applications
- ✅ Reviewing plans and documents
- ✅ Scheduling inspections
- ✅ Managing staff and workload
- ✅ Viewing analytics and reports
- ✅ Public access to permit information
- ✅ Video-based remote inspections

---

## Integration Points

1. **Inspection Assignment**: Web platform assigns → Mobile app receives
2. **Data Sync**: Mobile app collects → Web platform stores
3. **Status Updates**: Mobile app updates → Web platform reflects
4. **Notifications**: Web platform sends → Mobile app receives
5. **Authentication**: Shared auth system (Supabase)

---

## Summary

- **m-inspector** = Mobile field tool for inspectors (React Native)
- **m-permits-inspections** = Web platform for permit management (Next.js)

They complement each other:
- **Web platform** = Administrative hub
- **Mobile app** = Field execution tool

Both are part of the same Permits & Inspections Hub but serve different user roles and use cases.
