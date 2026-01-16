# Deployment Guide

## Staging Deployment (Railway)

### Prerequisites
- Railway account
- GitHub repository
- Environment variables configured

### Steps

1. **Create Railway Project**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Create project
   railway init
   ```

2. **Deploy API Service**
   ```bash
   cd services/api
   railway up
   ```

3. **Deploy os-admin (Next.js)**
   ```bash
   cd apps/os-admin
   railway up
   ```

3. **Deploy Worker Service**
   ```bash
   cd services/worker
   railway up
   ```

4. **Set Environment Variables**
   - Go to Railway dashboard
   - Add all variables from `.env.example` files
   - Set `NODE_ENV=production`

5. **Configure Services**
   - API service: Port 3001
   - Worker service: Separate service
   - PostgreSQL: Railway PostgreSQL addon
   - Redis: Railway Redis addon or Upstash

### Environment Variables for Staging

**API Service:**
- `PORT=3001`
- `NODE_ENV=production`
- `DATABASE_URL` (from Railway PostgreSQL)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `API_URL` (Railway URL)
- `LOG_LEVEL=info`

**os-admin (Next.js):**
- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL` (Railway API URL)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Worker Service:**
- `REDIS_URL` (from Railway Redis or Upstash)
- `DATABASE_URL` (from Railway PostgreSQL)
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `ANTHROPIC_API_KEY`
- `REPORTS_DIR=/app/reports`
- `REPORTS_URL_PREFIX=/reports`

## Production Deployment

Similar to staging, but:
- Use production environment variables
- Enable monitoring (Sentry, LogRocket)
- Set up CI/CD pipeline
- Configure custom domains
- Set up SSL certificates

## Health Checks

- API: `GET /health`
- Worker: Check Redis connection on startup

## Monitoring

- Railway provides built-in monitoring
- Add Sentry for error tracking
- Add LogRocket for session replay
- Monitor queue metrics
- Monitor database performance
