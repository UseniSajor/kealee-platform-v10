# Cursor Agent Development Rules

## 🚨 Critical Guardrails

### Prisma Migrations

**NEVER run `prisma migrate dev` in:**
- CI/CD pipelines
- Railway deployments
- Production environments
- Any automated deployment process

**ONLY use `prisma migrate deploy` for:**
- Production deployments
- Staging deployments
- Railway service startup
- Release deployments

**Rationale:** `migrate dev` creates new migration files and can modify the database schema. `migrate deploy` only applies existing migrations safely.

### Environment Files

**NEVER modify:**
- `.env` files
- `.env.local` files
- `.env.production` files
- Any real environment files in the repository

**ONLY modify:**
- `.env.example` files
- Environment variable templates in `env-templates/`
- Documentation files that describe environment variables

**Rationale:** Real environment files contain sensitive credentials and are gitignored. Changes should be documented in example files.

### Branch Strategy

- **Staging:** Uses `main` branch
- **Production:** Uses `release` branch

**NEVER:**
- Deploy `main` branch to production
- Deploy `release` branch to staging
- Mix staging and production deployments from the same branch

**Rationale:** Clear separation prevents accidental production deployments and data corruption.

### Database Isolation

**CRITICAL:** Staging must NEVER connect to production databases.

**Rules:**
- Staging environment must use separate database instances
- Production environment must use separate database instances
- Never share `DATABASE_URL` between staging and production
- Verify database isolation before any deployment

**Railway Configuration:**
- Staging services must use `staging-postgres.internal` or similar
- Production services must use `production-postgres.internal` or similar
- All Railway services must use `.railway.internal` DB hosts (internal networking)

**Rationale:** Database isolation prevents data corruption, security breaches, and accidental data loss.

### DATABASE_URL Usage

**DATABASE_URL must ONLY exist in:**
- Backend services (API, Worker)
- Railway environment variables (backend services only)
- Local development `.env.local` files (backend services only)

**DATABASE_URL must NEVER exist in:**
- Frontend applications (Vercel)
- Client-side code
- Public environment variables
- Any `NEXT_PUBLIC_*` variables

**Rationale:** Database credentials are sensitive and must never be exposed to client-side code or public environments.

### Railway Service Configuration

**All Railway services must:**
- Use `.railway.internal` database hosts for internal networking
- Never use external database URLs when internal URLs are available
- Configure proper service-to-service networking

**Example:**
```
# ✅ CORRECT
DATABASE_URL=postgresql://user:pass@staging-postgres.internal:5432/railway

# ❌ WRONG
DATABASE_URL=postgresql://user:pass@external-host.com:5432/railway
```

**Rationale:** Internal networking is more secure, faster, and doesn't count against external bandwidth limits.

### Destructive Commands

**ALWAYS ask for confirmation before suggesting:**
- Database schema modifications
- Data migration commands
- Production deployment commands
- Environment variable changes
- Branch merges to production
- Any command that modifies production data

**Commands requiring confirmation:**
- `prisma migrate dev` (even in development)
- `prisma migrate reset`
- `prisma db push` (in production)
- `railway up` (production deployments)
- `vercel deploy --prod`
- Any `DROP` or `DELETE` SQL commands
- Git operations that affect `release` branch

**Rationale:** Prevents accidental data loss or production issues.

## 📋 Development Workflow

### Local Development
1. Use `.env.local` files (gitignored)
2. Run `prisma migrate dev` locally only
3. Test migrations thoroughly before committing
4. Update `.env.example` if new variables are needed

### Staging Deployment
1. Push to `main` branch
2. Railway automatically deploys from `main`
3. Uses `staging-postgres.internal` database
4. Verify isolation from production

### Production Deployment
1. Merge `main` → `release` branch
2. Railway deploys from `release` branch
3. Uses `production-postgres.internal` database
4. Run `prisma migrate deploy` at service start
5. Verify isolation from staging

## 🔒 Security Rules

1. **Never commit secrets:** All `.env*` files are gitignored
2. **Never expose DATABASE_URL:** Only in backend, never frontend
3. **Use internal networking:** Railway services use `.railway.internal` hosts
4. **Verify isolation:** Always confirm staging/production separation
5. **Document changes:** Update `.env.example` when adding new variables

## ⚠️ Common Mistakes to Avoid

- ❌ Running `prisma migrate dev` in Railway
- ❌ Modifying `.env` files directly
- ❌ Deploying `main` to production
- ❌ Sharing DATABASE_URL between environments
- ❌ Using external DB URLs when internal available
- ❌ Adding DATABASE_URL to Vercel frontend apps
- ❌ Suggesting destructive commands without confirmation

## ✅ Best Practices

- ✅ Always use `prisma migrate deploy` in deployments
- ✅ Update `.env.example` when adding variables
- ✅ Use `main` for staging, `release` for production
- ✅ Verify database isolation before deployments
- ✅ Use `.railway.internal` hosts for Railway services
- ✅ Ask for confirmation before destructive operations
- ✅ Test migrations locally before committing

---

**Remember:** These rules exist to prevent data loss, security breaches, and production incidents. When in doubt, ask for confirmation before proceeding.

