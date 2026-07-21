# 🚀 Kealee Development Website - Quick Start Guide

## Complete Setup in 5 Steps

### Step 1: Install Dependencies
```bash
cd kealee-website
npm install --legacy-peer-deps
```

### Step 2: Set Up Database
```bash
# Generate Prisma Client
npm run db:generate

# Create database tables
npm run db:push

# Create default admin user
npm run db:seed
```

**Default Admin Credentials Created:**
- Email: `admin@kealeedevelopment.com`
- Password: `admin123`
- ⚠️ Change this in production!

### Step 3: Configure Email (Optional for Testing)
Edit `.env.local`:
- Get free API key from https://resend.com
- Add your `RESEND_API_KEY`
- Or skip this step - submissions will still be saved to database

### Step 4: Run Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

### Step 5: Test Everything

**Test the Website:**
1. Navigate through all 5 pages
2. Click "Request a Project Review"
3. Fill out and submit the form
4. Check console logs (or email if configured)

**Test the Database:**
```bash
# Open Prisma Studio to view data
npm run db:studio
```

Visit: http://localhost:5555
- View submitted leads
- Check admin users
- Browse email logs

**Test the Admin API:**

Login (get auth token):
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kealeedevelopment.com","password":"admin123"}'
```

Get leads (use token from login):
```bash
curl http://localhost:3000/api/admin/leads \
  -H "Cookie: admin-token=YOUR_TOKEN_HERE"
```

Get analytics:
```bash
curl http://localhost:3000/api/admin/analytics \
  -H "Cookie: admin-token=YOUR_TOKEN_HERE"
```

## ✅ What You Now Have

### Frontend (Already Built)
✅ 5 complete pages (Home, Services, How It Works, Experience, Contact)
✅ Professional design with deep rustic orange accent
✅ Fully responsive mobile layout
✅ Lead intake form with validation
✅ Download 1-pager button
✅ SEO optimized

### Backend (Just Built)
✅ **Database with Prisma**
  - SQLite for development
  - PostgreSQL ready for production
  - Type-safe queries

✅ **6 Data Models**
  - Lead (intake submissions)
  - Admin (user accounts)
  - Note (internal notes on leads)
  - Tag (categorization)
  - EmailLog (email tracking)
  - AnalyticsEvent (behavior tracking)

✅ **Authentication System**
  - JWT tokens with HttpOnly cookies
  - bcrypt password hashing
  - Role-based access control (VIEWER/EDITOR/ADMIN)

✅ **12 API Endpoints**
  - `/api/intake` - Submit leads
  - `/api/analytics/track` - Track events
  - `/api/admin/login` - Authenticate
  - `/api/admin/logout` - Sign out
  - `/api/admin/leads` - List/update leads
  - `/api/admin/leads/[id]` - Get/delete lead
  - `/api/admin/leads/[id]/notes` - Add notes
  - `/api/admin/analytics` - Dashboard stats
  - `/api/admin/export` - Export to CSV/JSON

✅ **Analytics & Reporting**
  - Lead conversion tracking
  - Response time calculation
  - Budget/asset type distribution
  - Lead trend over time
  - Custom event tracking

## 📊 Viewing Your Data

### Option 1: Prisma Studio (Recommended)
```bash
npm run db:studio
```
Beautiful UI at http://localhost:5555

### Option 2: Database File
SQLite database at: `prisma/dev.db`
Open with any SQLite viewer

### Option 3: API Endpoints
Use Postman, Insomnia, or curl to query the admin APIs

## 🎯 Common Tasks

### View All Leads
```bash
npm run db:studio
# Click "Lead" in left sidebar
```

### Change Admin Password
1. Open Prisma Studio
2. Click "Admin"
3. Find your admin user
4. Generate new hash: https://bcrypt-generator.com/
5. Replace `passwordHash` field

### Reset Database
```bash
Remove-Item prisma\dev.db
npm run db:push
npm run db:seed
```

### Export Leads to Excel
```bash
# Via API (with auth token)
curl http://localhost:3000/api/admin/export?format=csv \
  -H "Cookie: admin-token=TOKEN" \
  --output leads.csv

# Or build admin dashboard with export button
```

### Add New Admin User
```bash
npm run db:studio
# Click "Admin" → "Add record"
# Use https://bcrypt-generator.com/ for password hash
```

## 🔧 Troubleshooting

### Database Errors
```bash
npm run db:generate
npm run db:push
```

### "Prisma Client not found"
```bash
npm run db:generate
```

### Admin Can't Login
```bash
npm run db:seed  # Recreates admin user
```

### Clear All Data
```bash
Remove-Item prisma\dev.db -Force
npm run db:push
npm run db:seed
```

## 🚀 Next Steps

### For Development
1. ✅ Test lead submissions
2. ✅ View leads in Prisma Studio
3. ✅ Test admin API endpoints
4. ⏭️ Build admin dashboard UI (optional)

### For Production
1. Set up PostgreSQL database
2. Update `DATABASE_URL` in Vercel
3. Generate strong `JWT_SECRET`
4. Deploy to Vercel
5. Run migrations: `npm run db:push`

## 📚 Full Documentation

- **BACKEND-README.md** - Complete backend documentation
- **README.md** - Frontend overview
- **SETUP-GUIDE.md** - Detailed setup instructions

## 🎉 You're Ready!

Your complete website with backend is now running. Test it thoroughly, then deploy to production!

### Test Checklist:
- [ ] Website loads at http://localhost:3000
- [ ] All 5 pages are accessible
- [ ] Can submit intake form
- [ ] Prisma Studio shows submitted lead
- [ ] Can login with admin credentials
- [ ] API endpoints return data

### Production Checklist:
- [ ] Change admin password
- [ ] Generate strong JWT_SECRET
- [ ] Configure production database (PostgreSQL)
- [ ] Add email API keys
- [ ] Deploy to Vercel
- [ ] Test live site
- [ ] Set up domain

**Need Help?** Check the detailed docs in BACKEND-README.md
