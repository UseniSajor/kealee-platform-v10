# Kealee Platform V10

A comprehensive construction project management platform with integrated permits, inspections, marketplace, and AI-powered features.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Docker Desktop** (for local PostgreSQL & Redis)
- **Supabase Account** (for authentication)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp services/api/.env.example services/api/.env.local
# Edit services/api/.env.local with your credentials

# Start local services (PostgreSQL & Redis)
docker-compose up -d

# Run database migrations
cd packages/database
pnpm db:migrate

# Start development server
pnpm dev
```

## 📁 Project Structure

```
kealee-platform-v10/
├── apps/              # Frontend applications
│   ├── os-admin/      # Admin dashboard
│   ├── os-pm/         # Project manager app
│   └── m-inspector/   # Inspector mobile app
├── services/          # Backend services
│   ├── api/           # Main API service (Fastify)
│   ├── worker/        # Background job processor (BullMQ)
│   └── ai-learning/   # ML/AI service
├── packages/          # Shared packages
│   ├── database/      # Prisma schema & client
│   ├── api-client/    # Shared API client
│   ├── shared-ai/     # AI utilities
│   └── types/         # TypeScript types
└── _docs/             # Documentation
```

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** Shadcn/ui
- **State:** React Context + Server Components

### Backend
- **API:** Fastify
- **Database:** PostgreSQL 16
- **ORM:** Prisma
- **Cache:** Redis (Upstash)
- **Queue:** BullMQ
- **Auth:** Supabase Auth

### Infrastructure
- **Hosting:** Railway (backend) + Vercel (frontend)
- **File Storage:** AWS S3 / Cloudflare R2
- **Email:** SendGrid
- **Payments:** Stripe Connect
- **ML/AI:** Claude API (Anthropic)

## 📚 Documentation

- **[Railway Environment Setup](./RAILWAY_ENVIRONMENT_SETUP.md)** - ⚠️ **IMPORTANT:** Staging & Production isolation guide
- **[Railway Quick Reference](./RAILWAY_QUICK_REFERENCE.md)** - Quick checklist and fixes
- **[Database Deployment](./packages/database/README.md)** - Prisma migrations guide
- **[Environment Setup](./services/api/ENV_SETUP.md)** - Environment variables
- **[Supabase Setup](./services/api/SUPABASE_SETUP.md)** - Supabase configuration
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment
- **[Master Build Guide](./_docs/01_MASTER_BUILD_GUIDE_V2.md)** - Complete architecture

## 🔧 Development

### Start Services

```bash
# Start all services
pnpm dev

# Start specific service
cd services/api && pnpm dev
cd services/worker && pnpm dev
cd apps/os-admin && pnpm dev
```

### Database

```bash
# Run migrations
cd packages/database
pnpm db:migrate

# Generate Prisma client
pnpm db:generate

# Open Prisma Studio
pnpm db:studio
```

### Testing

```bash
# Run all tests
pnpm test

# Run API tests
pnpm test:api

# Run with coverage
pnpm test:api:coverage
```

## 🔐 Environment Variables

### Required for API Service

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kealee

# API
PORT=3001
NODE_ENV=development

# Audit
AUDIT_SIGNING_KEY=your_generated_key
```

See [ENV_SETUP.md](./services/api/ENV_SETUP.md) for complete list.

## 🚢 Deployment

### Railway (Backend)

1. Create Railway project
2. Add PostgreSQL service
3. Add Redis service (or use Upstash)
4. Deploy API service
5. Set environment variables
6. Run migrations

See [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) for detailed instructions.

### Vercel (Frontend)

1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy

## 📝 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

This is a private commercial project. For questions or issues, contact the development team.

## 📞 Support

- **Documentation:** Check `_docs/` folder
- **Setup Issues:** See [SETUP_STATUS.md](./SETUP_STATUS.md)
- **API Documentation:** Available at `/api/docs` when server is running

---

Built with ❤️ by the Kealee Team
