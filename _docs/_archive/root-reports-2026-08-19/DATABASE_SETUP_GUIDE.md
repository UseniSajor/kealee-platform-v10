# Database Setup Guide

## **🚨 FIXING DATABASE AUTHENTICATION ERROR**

You're seeing this error because the local PostgreSQL database credentials are incorrect or PostgreSQL isn't running.

---

## **✅ RECOMMENDED: Use Railway Database**

### **Step 1: Get Database URL from Railway**

1. Go to [Railway Dashboard](https://railway.app)
2. Select your **Kealee-Platform** project
3. Click on your **PostgreSQL** service
4. Go to the **Variables** tab
5. Find and copy the `DATABASE_URL` value

It will look like:
```
postgresql://postgres:PASSWORD@containers-us-west-123.railway.app:5432/railway
```

### **Step 2: Update Local .env File**

```bash
# Navigate to database package
cd "c:\Kealee-Platform v10\packages\database"

# Edit .env file
# Replace the contents with your Railway DATABASE_URL
```

**Example .env file:**
```env
# Railway Production Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@containers-us-west-123.railway.app:5432/railway"
```

### **Step 3: Test Connection**

```bash
pnpm prisma db pull
```

If successful, you'll see:
```
✔ Introspected 100+ models and wrote them into prisma/schema.prisma
```

---

## **⚠️ ALTERNATIVE: Set Up Local PostgreSQL**

If you prefer a local database:

### **Windows - Using PostgreSQL Installer**

1. **Download PostgreSQL:**
   - Visit: https://www.postgresql.org/download/windows/
   - Download PostgreSQL 15 or 16
   - Run installer

2. **During Installation:**
   - Set password for postgres user: `kealee_dev`
   - Port: `5432` (default)
   - Remember this password!

3. **Create Database and User:**

Open pgAdmin or Command Prompt:

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE kealee;

-- Create user
CREATE USER kealee WITH PASSWORD 'kealee_dev';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE kealee TO kealee;

-- Connect to kealee database
\c kealee

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO kealee;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kealee;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kealee;

-- Exit
\q
```

4. **Update .env file:**

```env
DATABASE_URL="postgresql://kealee:kealee_dev@localhost:5432/kealee?schema=public"
```

5. **Run Migrations:**

```bash
cd "c:\Kealee-Platform v10\packages\database"
pnpm prisma migrate dev
pnpm prisma generate
```

---

## **🐳 ALTERNATIVE: Use Docker PostgreSQL**

### **Step 1: Install Docker Desktop**

1. Download from: https://www.docker.com/products/docker-desktop/
2. Install and start Docker Desktop

### **Step 2: Create docker-compose.yml**

Create this file in `c:\Kealee-Platform v10\`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: kealee-postgres
    restart: always
    environment:
      POSTGRES_USER: kealee
      POSTGRES_PASSWORD: kealee_dev
      POSTGRES_DB: kealee
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### **Step 3: Start Database**

```bash
# Start PostgreSQL
docker-compose up -d

# Check it's running
docker ps
```

### **Step 4: Update .env**

```env
DATABASE_URL="postgresql://kealee:kealee_dev@localhost:5432/kealee?schema=public"
```

### **Step 5: Run Migrations**

```bash
cd packages/database
pnpm prisma migrate dev
pnpm prisma generate
```

---

## **🧪 TESTING: Use SQLite (Quick & Easy)**

For quick local testing without PostgreSQL:

### **Step 1: Update schema.prisma**

Change datasource from postgresql to sqlite:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### **Step 2: Update .env**

```env
DATABASE_URL="file:./dev.db"
```

### **Step 3: Run Migrations**

```bash
pnpm prisma migrate dev --name init
pnpm prisma generate
```

**⚠️ Warning:** SQLite doesn't support all PostgreSQL features. Use only for quick testing.

---

## **✅ VERIFY SETUP**

After choosing an option, verify your setup:

```bash
cd packages/database

# Test connection
pnpm prisma db pull

# Generate client
pnpm prisma generate

# View database in browser
pnpm prisma studio
```

---

## **🔍 TROUBLESHOOTING**

### **Error: "Can't reach database server"**

- **PostgreSQL not running:**
  ```bash
  # Windows - Check if PostgreSQL is running
  services.msc
  # Look for "postgresql-x64-15" service
  ```

- **Docker not running:**
  ```bash
  docker ps
  # If empty, start Docker Desktop
  ```

- **Wrong host/port:**
  - Check if PostgreSQL is on port 5432
  - Try `localhost` instead of `127.0.0.1`

### **Error: "Authentication failed"**

- **Wrong password:**
  - Double-check password in .env matches PostgreSQL
  - Use quotes around DATABASE_URL if password has special chars

- **User doesn't have permissions:**
  ```sql
  -- Grant permissions
  GRANT ALL PRIVILEGES ON DATABASE kealee TO kealee;
  ```

### **Error: "Database doesn't exist"**

```sql
-- Create database
CREATE DATABASE kealee;
```

---

## **🎯 RECOMMENDED SETUP FOR DEVELOPMENT**

**Best Practice:** Use Railway database for development, same as production.

**Why?**
- ✅ No local setup needed
- ✅ Same environment as production
- ✅ No credential issues
- ✅ Access from anywhere
- ✅ Automatic backups

**Steps:**
1. Get `DATABASE_URL` from Railway
2. Update `packages/database/.env`
3. Run `pnpm prisma generate`
4. Start coding! 🚀

---

## **📝 ENVIRONMENT VARIABLES**

### **Development (.env.local in services/api)**

```env
# Use Railway database
DATABASE_URL="postgresql://postgres:PASSWORD@railway.app:5432/railway"

# Or use local
DATABASE_URL="postgresql://kealee:kealee_dev@localhost:5432/kealee"
```

### **Production (Railway Variables)**

Set in Railway Dashboard → Service → Variables:
- `DATABASE_URL` - Auto-generated by Railway PostgreSQL service

---

## **🚀 QUICK START (Railway)**

```bash
# 1. Get Railway DATABASE_URL
# 2. Update .env
echo 'DATABASE_URL="your-railway-url"' > packages/database/.env

# 3. Generate Prisma Client
cd packages/database
pnpm prisma generate

# 4. Start API
cd ../../services/api
pnpm dev

# Done! ✅
```

---

**Need Help?** Check Railway logs or reach out to the team.
