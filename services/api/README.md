# Kealee Platform API Service

Fastify-based API server for Kealee Platform V10.

## Features

- ✅ Authentication (Supabase Auth)
- ✅ Organizations management
- ✅ RBAC (Roles & Permissions)
- ✅ Module Entitlements
- ✅ Event Logging
- ✅ Audit Logging

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL database
- Supabase account (for authentication)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your credentials
```

### Environment Variables

```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=postgresql://user:password@localhost:5432/kealee?schema=public
```

### Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## API Endpoints

### Authentication
- `POST /auth/signup` - Create new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `POST /auth/verify` - Verify token
- `GET /auth/me` - Get current user

### Organizations
- `POST /orgs` - Create organization
- `GET /orgs` - List organizations
- `GET /orgs/:id` - Get organization
- `PUT /orgs/:id` - Update organization
- `POST /orgs/:id/members` - Add member
- `DELETE /orgs/:id/members/:userId` - Remove member
- `PUT /orgs/:id/members/:userId` - Update member role
- `GET /orgs/my` - Get user's organizations

### Users
- `GET /users` - List users (with pagination, filtering, search)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user profile
- `GET /users/:id/orgs` - Get user's organizations

### RBAC
- `POST /rbac/roles` - Create role
- `GET /rbac/roles` - List roles
- `GET /rbac/roles/:key` - Get role
- `GET /rbac/roles/:key/permissions` - Get role permissions
- `POST /rbac/permissions` - Create permission
- `GET /rbac/permissions` - List permissions
- `POST /rbac/roles/:roleKey/permissions/:permissionKey` - Assign permission
- `GET /rbac/users/:userId/orgs/:orgId/permissions` - Get user permissions
- `POST /rbac/check` - Check permission

### Module Entitlements
- `POST /entitlements/orgs/:orgId/modules/:moduleKey/enable` - Enable module
- `POST /entitlements/orgs/:orgId/modules/:moduleKey/disable` - Disable module
- `GET /entitlements/orgs/:orgId/modules/:moduleKey` - Get entitlement
- `GET /entitlements/orgs/:orgId` - Get org entitlements
- `GET /entitlements/orgs/:orgId/enabled` - Get enabled modules
- `POST /entitlements/check` - Check module access

### Events
- `POST /events` - Record event
- `GET /events` - List events (with filtering)
- `GET /events/:id` - Get event
- `GET /events/entity/:entityType/:entityId` - Get entity events
- `GET /events/user/:userId` - Get user events
- `GET /events/org/:orgId` - Get org events
- `GET /events/stats` - Get event statistics

### Audit
- `POST /audit` - Record audit log
- `GET /audit` - List audit logs (with filtering)
- `GET /audit/:id` - Get audit log
- `GET /audit/entity/:entityType/:entityId` - Get entity audit trail
- `GET /audit/user/:userId` - Get user audit logs
- `GET /audit/privileged` - Get privileged actions
- `GET /audit/stats` - Get audit statistics

## Project Structure

```
services/api/
├── src/
│   ├── modules/
│   │   ├── auth/          # Authentication
│   │   ├── orgs/          # Organizations
│   │   ├── rbac/          # Roles & Permissions
│   │   ├── entitlements/  # Module Entitlements
│   │   ├── events/        # Event Logging
│   │   └── audit/         # Audit Logging
│   ├── __tests__/         # Test files
│   └── index.ts           # Server entry point
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Development Notes

- All routes are prefixed (e.g., `/auth`, `/orgs`)
- Protected routes require authentication via `Authorization: Bearer <token>` header
- Some routes require additional permissions (RBAC) or module access
- Event and audit logging are append-only (immutable)

## Next Steps

- [ ] Add request validation (Zod schemas)
- [ ] Add rate limiting
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Set up test database for integration tests
- [ ] Add error handling middleware
- [ ] Deploy to staging environment
