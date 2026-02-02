# Kealee Estimation Portal (m-estimation)

Professional construction cost estimation and takeoff management platform.

## 🚀 Quick Start

```bash
# Install dependencies (from root)
pnpm install

# Start development server
cd apps/m-estimation
pnpm dev

# Open browser
# http://localhost:3009
```

## 📁 Project Structure

```
m-estimation/
├── app/
│   ├── (auth)/              # Authentication pages (TODO)
│   ├── (dashboard)/         # Main dashboard pages
│   │   ├── layout.tsx       # Dashboard layout with sidebar
│   │   ├── page.tsx         # Dashboard home ✅
│   │   ├── estimates/       # Estimate management
│   │   │   ├── page.tsx     # Estimates list ✅
│   │   │   ├── new/         # Create estimate wizard
│   │   │   │   └── page.tsx # Wizard container ✅
│   │   │   └── [id]/        # Estimate details (TODO)
│   │   ├── assemblies/      # Assembly library (TODO)
│   │   ├── cost-database/   # Cost management (TODO)
│   │   ├── takeoff/         # Takeoff module (TODO)
│   │   ├── reports/         # Analytics (TODO)
│   │   └── settings/        # Settings (TODO)
│   ├── api/                 # API routes (optional)
│   ├── layout.tsx           # Root layout ✅
│   ├── globals.css          # Global styles ✅
│   └── providers.tsx        # React Query, Toast providers ✅
│
├── components/
│   ├── estimates/
│   │   ├── EstimateWizard.tsx          # Wizard shell ✅
│   │   └── wizard/                     # Wizard steps (TODO - CRITICAL)
│   │       ├── BasicInfoStep.tsx       # Step 1 (TODO)
│   │       ├── ScopeAnalysisStep.tsx   # Step 2 (TODO)
│   │       ├── BuildEstimateStep.tsx   # Step 3 (TODO)
│   │       ├── SettingsStep.tsx        # Step 4 (TODO)
│   │       └── ReviewStep.tsx          # Step 5 (TODO)
│   ├── assemblies/          # Assembly components (TODO)
│   ├── cost-database/       # Cost database components (TODO)
│   ├── takeoff/             # Takeoff components (TODO)
│   ├── shared/
│   │   ├── DashboardNav.tsx            # Sidebar navigation ✅
│   │   └── DashboardHeader.tsx         # Top header ✅
│   └── ui/                  # Shadcn UI components
│       ├── button.tsx       # ✅
│       ├── card.tsx         # ✅
│       ├── input.tsx        # ✅
│       ├── label.tsx        # ✅
│       ├── badge.tsx        # ✅
│       ├── progress.tsx     # ✅
│       ├── toast.tsx        # ✅
│       └── ...              # More needed (TODO)
│
├── lib/
│   ├── api.ts               # API client ✅
│   ├── utils.ts             # Utility functions ✅
│   └── calculations.ts      # Cost calculations ✅
│
└── public/                  # Static assets

```

## 🎯 Current Status: 40% Complete

### ✅ Completed
- [x] Project setup and configuration
- [x] Core infrastructure (layout, providers, styling)
- [x] API client with all endpoints
- [x] Utility functions and calculation engine
- [x] Essential UI components
- [x] Dashboard home page with stats
- [x] Estimates list page with search/filter
- [x] Wizard shell with progress indicator

### 🚧 In Progress / TODO
- [ ] **5 wizard step components** (CRITICAL - Next priority)
- [ ] **Estimate editor** (High priority)
- [ ] Assembly library page
- [ ] Cost database page
- [ ] Takeoff module
- [ ] Reports & analytics
- [ ] Authentication
- [ ] Additional UI components

## 🛠️ Development Guide

### Adding a New Wizard Step

1. Create the step component in `components/estimates/wizard/`:

```typescript
// components/estimates/wizard/BasicInfoStep.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BasicInfoStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSubmitting?: boolean;
}

export function BasicInfoStep({
  data,
  onNext,
  onBack,
  isFirst,
}: BasicInfoStepProps) {
  const [formData, setFormData] = useState(data.basicInfo || {
    projectName: '',
    clientName: '',
    projectType: '',
    location: '',
    description: '',
  });

  const handleSubmit = () => {
    // Validation
    if (!formData.projectName) {
      alert('Project name is required');
      return;
    }

    onNext({ basicInfo: formData });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Basic Information</h2>
        <p className="text-muted-foreground mt-1">
          Tell us about your project
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="projectName">Project Name *</Label>
          <Input
            id="projectName"
            value={formData.projectName}
            onChange={(e) =>
              setFormData({ ...formData, projectName: e.target.value })
            }
            placeholder="e.g., Residential Addition"
          />
        </div>

        {/* Add more fields */}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isFirst}
        >
          Back
        </Button>
        <Button onClick={handleSubmit}>
          Next: Scope Analysis
        </Button>
      </div>
    </div>
  );
}
```

2. The wizard will automatically include it based on the steps array in `EstimateWizard.tsx`

### API Integration

```typescript
// Example: Fetch estimates
import { apiClient } from '@/lib/api';

const { data, error } = await apiClient.getEstimates({
  search: 'residential',
  status: 'draft',
  page: 1,
});
```

### Using Calculations

```typescript
import { calculateCostBreakdown } from '@/lib/calculations';

const breakdown = calculateCostBreakdown(sections, {
  overheadPercent: 15,
  profitPercent: 10,
  contingencyPercent: 5,
  taxPercent: 7.5,
});

console.log(breakdown.total); // Final estimate total
```

## 📝 Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# API
NEXT_PUBLIC_API_URL=http://localhost:3001
API_URL=http://localhost:3001

# App
NEXT_PUBLIC_APP_URL=http://localhost:3009
NODE_ENV=development

# Claude AI (optional, for AI features)
ANTHROPIC_API_KEY=your_key

# Redis (optional, for job queue)
REDIS_URL=redis://localhost:6379
```

## 🎨 Design System

### Colors
- **Primary (Blue)**: `bg-primary` - Main brand color
- **Secondary (Orange)**: `bg-secondary` - Accent color
- **Material Cost (Purple)**: `bg-material-cost`
- **Labor Cost (Cyan)**: `bg-labor-cost`
- **Equipment Cost (Amber)**: `bg-equipment-cost`

### Typography
- Font: Inter (from Google Fonts)
- Sizes: `text-xs` to `text-3xl`

### Components
Using Shadcn/ui components with custom styling.

## 🧪 Testing

```bash
# Run tests (when implemented)
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## 📚 Key Features

### Completed
- ✅ Dashboard with stats overview
- ✅ Estimates list with search and filtering
- ✅ Multi-step estimate creation wizard shell
- ✅ Responsive sidebar navigation
- ✅ Toast notifications
- ✅ Real-time cost calculations (client-side)

### Planned
- ⏳ AI-powered scope analysis
- ⏳ Pre-built assembly library (50+ templates)
- ⏳ Cost database management
- ⏳ PDF plan viewer with takeoff tools
- ⏳ Export to PDF, Excel, CSV
- ⏳ Integration with Bid Engine (APP-01)
- ⏳ Integration with Budget Tracker (APP-07)
- ⏳ Real-time collaboration (future)

## 🔗 Related Packages

- **@kealee/estimation-tool**: Backend estimation logic (85% complete)
- **@kealee/api-client**: API client library
- **@kealee/auth**: Authentication utilities
- **@kealee/database**: Prisma schema and client
- **@kealee/ui**: Shared UI components

## 📖 Documentation

- [UI Specification](./UI_SPECIFICATION.md) - Complete design spec
- [Implementation Status](./IMPLEMENTATION_STATUS.md) - Current progress
- [Integration Guide](../../ESTIMATION_TOOL_INTEGRATION.md) - Backend integration

## 🚀 Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Deploy to Vercel
vercel --prod
```

## 🤝 Contributing

This is part of the Kealee Platform monorepo. Follow the standard development workflow:

1. Create feature branch
2. Make changes
3. Test locally
4. Create PR
5. Deploy to staging
6. Deploy to production

## 📞 Support

For questions or issues:
- Check `IMPLEMENTATION_STATUS.md` for current progress
- Review `UI_SPECIFICATION.md` for design details
- Contact the development team

---

**Status:** 🚧 MVP Phase 1 (40% complete)  
**Next Priority:** Complete wizard step components  
**Target:** Production-ready in 2-3 weeks
