# Kealee Platform v20 - Claude Code Context

This file preserves key context for Claude Code sessions working on this project.

## Project Overview

Kealee Platform v20 is a full-lifecycle construction development platform with 18 apps, 11 services, 34 packages, and 13 AI bots, built as a monorepo using pnpm workspaces. Evolved from v10 with formal service layers, Digital Development Twin System (DDTS), and KeaBot automation agents.

## Repository Structure

```
Kealee-Platform v10/
├── apps/                    # Next.js frontend applications
│   ├── m-architect/         # Architect mini-app
│   ├── m-finance-trust/     # Finance/Trust mini-app
│   ├── m-marketplace/       # Marketplace mini-app
│   ├── m-ops-services/      # Operations Services mini-app
│   ├── m-permits-inspections/ # Permits & Inspections mini-app
│   ├── m-project-owner/     # Project Owner mini-app
│   ├── os-admin/            # Admin dashboard
│   └── os-pm/               # Project Management dashboard
├── packages/
│   ├── database/            # Prisma schema and database package
│   │   └── prisma/
│   │       └── schema.prisma  # Main Prisma schema
│   └── automation/
│       └── apps/            # Backend automation tools (15 apps)
│           ├── estimation-tool/     # APP-06: Construction estimation
│           ├── bid-engine/          # APP-01: Bid management
│           ├── cost-database/       # APP-02: Cost database
│           └── ...                  # Other automation apps
└── pnpm-lock.yaml
```

## Key Technical Details

### Prisma Schema

- **Location**: `packages/database/prisma/schema.prisma`
- **Important**: The organization model is named `Org`, NOT `Organization`
- **Generate command**: `npx prisma generate` (run from packages/database/)

### Command Center Infrastructure Models (Added Jan 2026)

The following models were added for Command Center (APP-15):

1. **DashboardWidget** - User dashboard widgets with WidgetType enum
2. **JobQueue** - BullMQ job tracking with JobStatus enum
3. **JobSchedule** - Cron-based job scheduling
4. **SystemConfig** - Key-value system configuration
5. **IntegrationCredential** - Third-party service credentials with IntegrationService and IntegrationStatus enums
6. **AIConversation** - AI assistant conversation history

### Estimation Tool Package

- **Location**: `packages/automation/apps/estimation-tool/`
- **Build command**: `pnpm run build`
- **TypeScript config**: Uses CommonJS modules (`module: "NodeNext"`)
- **Key pattern**: Uses `require.main === module` for entry point detection (not `import.meta.url`)

### Build Commands

```bash
# Build estimation-tool
cd packages/automation/apps/estimation-tool
pnpm run build

# Generate Prisma client
cd packages/database
npx prisma generate

# Root level commands
pnpm install
pnpm run build
```

### Common Issues & Solutions

1. **Prisma JSON filter errors**: Don't use `metadata: { equals: null }` for JSON fields. Use post-query filtering instead.

2. **CommonJS import.meta error**: Use `require.main === module` instead of `import.meta.url` checks.

3. **Model naming**: Always check actual model names in schema.prisma (e.g., `Org` not `Organization`).

## Construction Domain Concepts

- **CSI MasterFormat**: Industry standard for organizing construction specs (division codes like "03" for Concrete)
- **Cost Databases**: RSMeans and similar databases for unit costs
- **Assemblies**: Pre-built groups of line items (e.g., "8-inch CMU Wall" assembly)
- **Takeoff**: Quantity extraction from construction plans
- **Value Engineering**: Cost optimization analysis

## Environment

- Node.js 20+
- pnpm package manager (v8.15.9 for Vercel compatibility)
- TypeScript 5.6+
- Prisma 5.22+
