# 🔧 Railway Preview Environment Configuration - DIFF

**Changes to make API safe for Railway Preview Environments**

---

## ✅ **REQUIREMENTS:**

1. ✅ Listen on `process.env.PORT` and bind to `0.0.0.0` — **ALREADY CORRECT**
2. ✅ Health endpoint without database dependency — **ALREADY CORRECT**
3. ⚠️ Remove hardcoded base URLs/domains — **NEEDS FIXES**

---

## 📝 **CHANGES NEEDED:**

### **File 1: `services/api/src/index.ts`**

**Change port default from 3001 to 3000:**

```diff
--- a/services/api/src/index.ts
+++ b/services/api/src/index.ts
@@ -229,7 +229,12 @@ const start = async () => {
       },
     } as any)
 
-    const port = Number(process.env.PORT) || 3001
+    // Railway provides PORT env var, default to 3000 for local dev
+    const port = Number(process.env.PORT) || 3000
+    
+    // Log environment for debugging
+    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
+    console.log(`🚀 Starting server on port ${port}`)
+    
     await fastify.listen({ port, host: '0.0.0.0' })
     console.log(`🚀 API server running on port ${port}`)
   } catch (err) {
```

**Status:** ✅ Already binds to `0.0.0.0` and uses `process.env.PORT`  
**Change:** Update default port and add logging

---

### **File 2: `services/api/src/config/openapi.ts`**

**Remove hardcoded domains, use environment variables:**

```diff
--- a/services/api/src/config/openapi.ts
+++ b/services/api/src/config/openapi.ts
@@ -14,14 +14,17 @@ export const openApiConfig = {
     version: '1.0.0',
   },
   servers: [
     {
-      url: 'https://api.kealee.com',
-      description: 'Production server',
+      url: process.env.API_BASE_URL || 'http://localhost:3000',
+      description: process.env.NODE_ENV === 'production' 
+        ? 'Production server' 
+        : process.env.NODE_ENV === 'staging' 
+          ? 'Staging server' 
+          : 'Development server',
     },
-    {
-      url: 'https://api-staging.kealee.com',
-      description: 'Staging server',
-    },
   ],
   components: {
     securitySchemes: {
```

**Status:** ⚠️ Hardcoded URLs  
**Change:** Use `API_BASE_URL` environment variable

---

### **File 3: `services/api/src/modules/permits/permit-application.service.ts`**

**Fix trackingUrl to use environment variable properly:**

```diff
--- a/services/api/src/modules/permits/permit-application.service.ts
+++ b/services/api/src/modules/permits/permit-application.service.ts
@@ -340,8 +340,9 @@ export class PermitApplicationService {
       permitNumber,
       status: 'under_review',
       submittedAt: new Date(),
-      trackingUrl: `${process.env.API_BASE_URL || 'https://api.kealee.com'}/v1/permits/${permitId}`,
+      trackingUrl: process.env.API_BASE_URL 
+        ? `${process.env.API_BASE_URL}/v1/permits/${permitId}`
+        : undefined, // Don't set if no base URL configured
     });
```

**Status:** ⚠️ Has fallback hardcoded URL  
**Change:** Make trackingUrl optional if API_BASE_URL not set

---

### **File 4: `services/api/src/modules/milestones/milestone-upload.service.ts`**

**Fix fileUrl to use environment variable properly:**

```diff
--- a/services/api/src/modules/milestones/milestone-upload.service.ts
+++ b/services/api/src/modules/milestones/milestone-upload.service.ts
@@ -140,8 +140,11 @@ export class MilestoneUploadService {
     const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
     const timestamp = Date.now();
     
-    const fileUrl = `${process.env.FILE_STORAGE_URL || 'https://storage.example.com'}/projects/${projectId}/milestones/${milestoneId}/${timestamp}_${sanitizedFileName}`
+    // Only generate URL if FILE_STORAGE_URL is configured
+    const fileUrl = process.env.FILE_STORAGE_URL
+      ? `${process.env.FILE_STORAGE_URL}/projects/${projectId}/milestones/${milestoneId}/${timestamp}_${sanitizedFileName}`
+      : null;
     
+    if (!fileUrl) throw new Error('FILE_STORAGE_URL not configured');
     return fileUrl;
```

**Status:** ⚠️ Has fallback hardcoded URL  
**Change:** Require FILE_STORAGE_URL to be set

---

### **File 5: `services/api/src/modules/handoff/handoff.service.ts`**

**Fix DocuSign URL:**

```diff
--- a/services/api/src/modules/handoff/handoff.service.ts
+++ b/services/api/src/modules/handoff/handoff.service.ts
@@ -173,9 +173,10 @@ export class HandoffService {
           ...contract,
           docusignStatus,
           docusignUrl: contract.docusignEnvelopeId
-              ? `https://demo.docusign.com/envelopes/${contract.docusignEnvelopeId}`
-              : undefined,
+            ? `${process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi'}/envelopes/${contract.docusignEnvelopeId}`
+            : undefined,
         }
```

**Status:** ⚠️ Hardcoded demo URL  
**Change:** Use DOCUSIGN_BASE_PATH environment variable

---

### **File 6: `services/api/src/sdk/cli.ts`**

**Fix CLI default URL:**

```diff
--- a/services/api/src/sdk/cli.ts
+++ b/services/api/src/sdk/cli.ts
@@ -18,7 +18,7 @@ const program = new Command();
 
 program
   .name('kealee-api')
-  .option('-u, --url <url>', 'API base URL', 'https://api.kealee.com')
+  .option('-u, --url <url>', 'API base URL', process.env.API_BASE_URL || 'http://localhost:3000')
   .option('-k, --api-key <key>', 'API key for authentication')
```

**Status:** ⚠️ Hardcoded production URL  
**Change:** Use environment variable or localhost

---

### **File 7: `services/api/src/modules/docusign/docusign.service.ts`**

**This one is already correct! ✅**

```typescript
// ALREADY CORRECT - uses environment variable with fallback
const DOCUSIGN_BASE_PATH = process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi'
```

**Status:** ✅ Already uses environment variable  
**Change:** None needed

---

## 🔑 **ENVIRONMENT VARIABLES NEEDED:**

Add these to Railway for both production and staging:

### **Production Environment:**
```env
PORT=3000
NODE_ENV=production
API_BASE_URL=https://kealee-platform-v10-production.up.railway.app
FILE_STORAGE_URL=https://your-s3-bucket.s3.amazonaws.com
DOCUSIGN_BASE_PATH=https://www.docusign.net/restapi
```

### **Staging Environment:**
```env
PORT=3000
NODE_ENV=staging
API_BASE_URL=https://api-staging-production-xxxx.up.railway.app
FILE_STORAGE_URL=https://your-staging-s3-bucket.s3.amazonaws.com
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
```

### **Preview/Development:**
```env
PORT=3000
NODE_ENV=development
# No hardcoded URLs - will use localhost or throw errors if features used
```

---

## ✅ **VERIFICATION CHECKLIST:**

After applying changes:

- [x] Server listens on `process.env.PORT` ✅ (already correct)
- [x] Server binds to `0.0.0.0` ✅ (already correct)  
- [x] `/health` endpoint works without database ✅ (already correct)
- [ ] No hardcoded production URLs in code ⚠️ (needs fixes above)
- [ ] All URLs use environment variables ⚠️ (needs fixes above)
- [ ] Service fails gracefully if optional URLs not set ⚠️ (needs fixes above)

---

## 🚀 **TESTING:**

### **Test 1: Health endpoint (no dependencies)**
```bash
curl https://your-preview-url.up.railway.app/health
# Should return: {"status":"ok"}
```

### **Test 2: Environment detection**
```bash
curl https://your-preview-url.up.railway.app/
# Check logs for: "🌍 Environment: staging"
```

### **Test 3: Dynamic base URL**
```bash
# In Railway logs, should see correct API_BASE_URL
# No references to hardcoded domains
```

---

## 📊 **SUMMARY:**

| File | Issue | Status | Priority |
|------|-------|--------|----------|
| `index.ts` | Port default | Minor | Low |
| `openapi.ts` | Hardcoded URLs | Fixed | High |
| `permit-application.service.ts` | Hardcoded fallback | Fixed | High |
| `milestone-upload.service.ts` | Hardcoded fallback | Fixed | High |
| `handoff.service.ts` | Hardcoded URL | Fixed | Medium |
| `cli.ts` | Hardcoded default | Fixed | Low |
| `docusign.service.ts` | Already correct | ✅ | N/A |

---

## 🎯 **PRIORITY FIXES:**

**Must Fix (High Priority):**
1. `config/openapi.ts` - Remove hardcoded server URLs
2. `permit-application.service.ts` - Remove URL fallback
3. `milestone-upload.service.ts` - Remove URL fallback

**Should Fix (Medium Priority):**
4. `handoff.service.ts` - Use env var for DocuSign

**Nice to Have (Low Priority):**
5. `index.ts` - Update port default to 3000
6. `cli.ts` - Use env var for default URL

---

## 💡 **IMPLEMENTATION NOTES:**

1. **Graceful Degradation:**
   - Health endpoint works without any env vars ✅
   - Features that need URLs will fail gracefully
   - Clear error messages when URLs not configured

2. **Preview Safety:**
   - No hardcoded production domains
   - Each preview gets its own Railway URL
   - Environment variables control behavior

3. **Local Development:**
   - Defaults to `localhost:3000`
   - Clear when features need configuration

---

**Apply these changes to make your API fully preview-safe!** ✅
