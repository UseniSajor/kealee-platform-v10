# m-permits-inspections

Next.js 14 application for permit application and inspection management.

## Features

- **Authentication**: Supabase Auth with role-based access
- **Permit Application**: Multi-step wizard with AI pre-review
- **Dashboard**: Kanban board and Timeline views
- **Inspection Management**: Request, schedule, and track inspections
- **Document Management**: Upload, preview, and manage permit documents
- **Integration**: Jurisdiction selector, fee calculator, status sync, webhooks

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase project with database schema

### Installation

```bash
cd apps/m-permits-inspections
pnpm install
```

### Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── dashboard/          # Dashboard pages
├── components/
│   ├── permit/            # Permit components
│   ├── inspection/        # Inspection components
│   ├── integration/       # Integration components
│   ├── layout/            # Layout components
│   └── ui/                # shadcn/ui components
├── lib/                    # Utilities and helpers
├── store/                  # Zustand stores
└── types/                  # TypeScript types
```

## Key Components

### Permit Application Wizard
- 5-step wizard: Project Info → Permit Type → Jurisdiction → Documents → Review
- Real-time validation with Zod
- Document upload with preview
- AI pre-review integration

### Permit Dashboard
- Kanban board with drag-and-drop
- Timeline view with progress tracking
- Document management
- Correction tracking

### Inspection Management
- Request inspection with checklist
- Photo upload for pre-inspection
- Results tracking
- Deficiency management

## Integration

### Jurisdiction Selector
Auto-detects jurisdiction by address or manual selection.

### Fee Calculator
Calculates permit fees based on jurisdiction rules and project valuation.

### Status Sync
Syncs permit status with jurisdiction portals via API or manual check.

### Webhooks
Receives real-time updates from jurisdiction systems for:
- Status changes
- Approvals
- Inspection scheduling
- Correction requests

## License

Proprietary - Kealee Platform
