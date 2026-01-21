# Troubleshooting Landing Pages - Ports 3000, 3004, 3007 Not Working

## Quick Diagnostic Steps

### 1. Check if Servers Are Actually Running

Open PowerShell and check what's on those ports:
```powershell
netstat -ano | findstr ":3000 :3004 :3007"
```

If nothing shows up, the servers aren't running.

### 2. Check PowerShell Windows

Look for the PowerShell windows that were opened for each app. Check for:
- **Build errors** (red text)
- **Port conflicts** ("port already in use")
- **Missing dependencies**
- **TypeScript errors**

### 3. Common Issues & Fixes

#### Issue: "Module not found" errors
**Solution:** Install dependencies
```powershell
cd apps/m-permits-inspections
pnpm install

cd ../m-architect
pnpm install

cd ../os-pm
pnpm install
```

#### Issue: Port already in use
**Solution:** Kill the process or use a different port
```powershell
# Find process using port 3000
netstat -ano | findstr :3000
# Kill it (replace PID with the number from above)
taskkill /PID <PID> /F
```

#### Issue: TypeScript/build errors
**Solution:** Check the terminal output for specific errors. Common fixes:
- Missing `lucide-react` → `pnpm add lucide-react`
- CSS variable issues → Check `globals.css`
- Import path issues → Check `tsconfig.json` paths

### 4. Manual Start (One at a Time)

Start each app individually to see errors clearly:

#### Permits & Inspections (Port 3000)
```powershell
cd "C:\Kealee-Platform v10\apps\m-permits-inspections"
pnpm dev
```

#### Architect (Port 3007)
```powershell
cd "C:\Kealee-Platform v10\apps\m-architect"
pnpm dev
```

#### PM Dashboard (Port 3004)
```powershell
cd "C:\Kealee-Platform v10\apps\os-pm"
pnpm dev
```

### 5. Check Browser Console

Once a server shows "Ready", check the browser:
- Open Developer Tools (F12)
- Check Console tab for JavaScript errors
- Check Network tab for failed requests

### 6. Verify Environment Setup

Make sure you're in the root directory and dependencies are installed:
```powershell
cd "C:\Kealee-Platform v10"
pnpm install
```

### 7. Check Next.js Version Compatibility

Some apps use Next.js 14, others use 16. If there are version conflicts:
- Check `package.json` in each app
- Ensure Node.js version is compatible (Node 18+)

## Expected Output When Server Starts

You should see:
```
✓ Ready in 2.3s
○ Compiling / ...
✓ Compiled / in 1.2s
✓ Ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

## If Still Not Working

**Share these details:**
1. Exact error message from PowerShell window
2. Node.js version: `node --version`
3. pnpm version: `pnpm --version`
4. Any red/error text in the terminal

## Quick Test - Start Just One

Let's start with the simplest one:

```powershell
cd "C:\Kealee-Platform v10\apps\m-project-owner"
pnpm dev
```

Then visit: http://localhost:3006

If this works, the issue is app-specific. If it doesn't, it's likely an environment setup issue.

