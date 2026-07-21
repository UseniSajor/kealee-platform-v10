@echo off
REM Production Database Deployment Script (Windows)
REM Deploys Prisma migrations to Railway production PostgreSQL instance

setlocal enabledelayedexpansion

echo ==========================================
echo Production Database Deployment
echo ==========================================
echo.

REM Verify DATABASE_URL is set
if "%DATABASE_URL%"=="" (
    echo ERROR: DATABASE_URL environment variable is not set
    echo Please set DATABASE_URL before running this script
    exit /b 1
)

echo [OK] DATABASE_URL is set
echo.

REM Verify we're in the correct directory
if not exist "prisma\schema.prisma" (
    echo ERROR: prisma\schema.prisma not found
    echo Please run this script from the packages\database directory
    exit /b 1
)

echo [OK] Schema file found
echo.

REM Check if migrations directory exists
if not exist "prisma\migrations" (
    echo WARNING: prisma\migrations directory not found
    echo Creating migrations directory...
    mkdir prisma\migrations
)

REM List migration files
echo Migration files to be applied:
echo ----------------------------------------
dir /b /ad prisma\migrations 2>nul | findstr /R "^[0-9]" | sort
echo.

REM Verify Prisma CLI is available
where npx >nul 2>&1
if errorlevel 1 (
    echo ERROR: npx not found
    echo Please install Node.js and npm
    exit /b 1
)

echo [OK] Prisma CLI available
echo.

REM Generate Prisma Client (verify schema is valid)
echo Step 1: Generating Prisma Client...
echo ----------------------------------------
call npx prisma generate --schema=./prisma/schema.prisma
if errorlevel 1 (
    echo [FAIL] Failed to generate Prisma Client
    echo Please fix schema errors before deploying
    exit /b 1
)
echo [OK] Prisma Client generated successfully
echo.

REM Check current migration status
echo Step 2: Checking migration status...
echo ----------------------------------------
call npx prisma migrate status --schema=./prisma/schema.prisma
echo.

REM Deploy migrations
echo Step 3: Deploying migrations...
echo ----------------------------------------
call npx prisma migrate deploy --schema=./prisma/schema.prisma
if errorlevel 1 (
    echo [FAIL] Migration deployment failed
    exit /b 1
)
echo [OK] Migrations deployed successfully
echo.

REM Verify schema matches database
echo Step 4: Verifying schema...
echo ----------------------------------------
call npx prisma db pull --schema=./prisma/schema.prisma --force
echo [OK] Schema verification completed
echo.

REM Test database connection
echo Step 5: Testing database connection...
echo ----------------------------------------
echo SELECT 1 as test; | call npx prisma db execute --stdin --schema=./prisma/schema.prisma
echo [OK] Database connection test completed
echo.

echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Run seed script: npm run db:seed
echo 2. Verify data: npx prisma studio
echo 3. Test application connections
echo.

endlocal
