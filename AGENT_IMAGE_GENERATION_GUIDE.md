# 🎨 Agent-Driven Image Generation Setup Guide

**Status:** ✅ Code Implementation Complete  
**Execution:** Automatic via KeaBot-Design Agent  
**Cost:** ~$5-10 for full 27-product catalog (DALL-E 3)  
**Timeline:** 30-45 minutes for 135 images

---

## 📋 WHAT WAS IMPLEMENTED

### 1. **ProductImage Database Model**
✅ Added to `packages/database/prisma/schema.prisma`

```prisma
model ProductImage {
  id          String   @id @default(cuid())
  productId   String
  type        String   // "before" | "after" | "hero" | "trend" | "detail"
  url         String   // DALL-E image URL
  prompt      String?  // Generation prompt
  style       String?  // Style variation (modern, traditional, etc.)
  generatedAt DateTime @default(now())
  
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```

**Linked to Product model** - Each product can have multiple images

---

### 2. **Image Generation Tool** 
✅ Created at `packages/ai/src/tools/generate-product-image.ts`

**Tool Definition:**
```typescript
{
  name: "generate_product_image",
  description: "Generate professional before/after images for renovation products",
  input_schema: {
    properties: {
      product_id: string,
      image_type: "before" | "after" | "hero" | "trend" | "detail",
      description: string,  // Detailed prompt
      style: "modern" | "contemporary" | "traditional" | "transitional" | "minimalist" | "luxury" | "rustic" | "industrial",
      room_type?: string
    }
  }
}
```

**Function Signature:**
```typescript
async function generate_product_image(input: {
  product_id: string;
  image_type: string;
  description: string;
  style: string;
  room_type?: string;
}): Promise<{
  success: boolean;
  product_id: string;
  image_url: string;
  style: string;
  prompt_used: string;
  db_save_command?: string;
}>
```

**Features:**
- Calls DALL-E 3 with high-quality prompts
- Returns image URL
- Generates database save command (for async persistence)
- Handles both before/after and showcase images
- Ensures no duplicate styles

---

### 3. **KeaBot-Design Integration**
✅ Updated `bots/keabot-design/src/bot.ts`

**Tool Registered:**
```typescript
// Tool: generate product images (for home page and product catalog)
this.registerTool(GENERATE_PRODUCT_IMAGE_TOOL_DEF as any);
```

**System Prompt Addition:**
```
You are KeaBot-Design, responsible for creating product showcase images.
When asked to generate product images, use the generate_product_image tool.
Ensure visual consistency and no duplicate styles.
Target styles: modern, contemporary, traditional, transitional, luxury.
```

---

### 4. **Admin API Endpoints**
✅ Created at `services/api/src/routes/admin/generate-images.ts`

**POST /admin/generate-images** (Admin Only)
```bash
curl -X POST https://arstic-kindness.up.railway.app/admin/generate-images \
  -H "X-API-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json"
```

**Query Parameters:**
- `productId` - Generate for specific product (optional, default: all 27)
- `types` - Image types (default: "before,after,hero")
- `dryRun` - Preview what will be generated (no DALL-E calls)

**Response (Example):**
```json
{
  "message": "Image generation queued",
  "plan": {
    "productsCount": 27,
    "imagesPerProduct": 6,
    "totalImages": 162,
    "estimatedCost": 6.48,
    "dryRun": false
  },
  "jobs": 27,
  "details": "KeaBot-Design will process these jobs. Check logs for progress."
}
```

---

**GET /admin/generate-images/status** (Admin Only)
```bash
curl https://arstic-kindness.up.railway.app/admin/generate-images/status \
  -H "X-API-Key: YOUR_ADMIN_KEY"
```

**Response:**
```json
{
  "totalProducts": 27,
  "totalImages": 15,
  "averageImagesPerProduct": 0.6,
  "completionPercentage": "11.1"
}
```

---

**POST /api/product-images** (Service Auth)
Called by KeaBot-Design to save images to database

```json
{
  "productId": "kitchen-remodel",
  "type": "after",
  "url": "https://oaidalleapiprodpublished.blob.core.windows.net/...",
  "prompt": "A beautifully renovated kitchen...",
  "style": "modern"
}
```

---

## 🚀 HOW TO EXECUTE IMAGE GENERATION

### **Option 1: Automatic Execution (Recommended)**

The agent executes **automatically** when you trigger the endpoint. No prompt needed.

#### **Step 1: Add Admin API Key to Railway**
```
Go to: Railway Dashboard > kealee-platform-v10 > arstic-kindness > Variables

Add:
ADMIN_API_KEY=your_secure_random_key_here
API_SERVICE_KEY=your_service_auth_key
```

#### **Step 2: Deploy Code**
```bash
# From local workspace:
git add .
git commit -m "feat: Add agent-driven image generation system"
git push origin main

# Railway auto-deploys in 2-3 minutes
```

#### **Step 3: Trigger Image Generation**
```bash
# Dry run (preview, no DALL-E calls):
curl -X POST "https://arstic-kindness.up.railway.app/admin/generate-images?dryRun=true" \
  -H "X-API-Key=your_admin_key"

# Full generation (all 27 products):
curl -X POST https://arstic-kindness.up.railway.app/admin/generate-images \
  -H "X-API-Key=your_admin_key"

# Single product:
curl -X POST "https://arstic-kindness.up.railway.app/admin/generate-images?productId=kitchen-remodel" \
  -H "X-API-Key=your_admin_key"

# Specific image types only:
curl -X POST "https://arstic-kindness.up.railway.app/admin/generate-images?types=before,after,hero" \
  -H "X-API-Key=your_admin_key"
```

#### **Step 4: Monitor Progress**
```bash
# Check Railway logs:
# Go to: Railway > arstic-kindness > Logs
# Look for: [keabot-design] ✅ Generated [type] image for [product]

# Or poll status endpoint:
curl https://arstic-kindness.up.railway.app/admin/generate-images/status \
  -H "X-API-Key=your_admin_key"
```

---

### **Option 2: Prompt-Based Execution (Via Chat Interface)**

If you want to interact with KeaBot-Design directly:

#### **Local Testing:**
```bash
cd /home/tim_chamberlain/kealee-platform-v10
pnpm --filter 'keabot-design' dev
```

Then send message to bot:
```
Generate 5 product images for kitchen-remodel:
- 2 before/after pairs in modern and contemporary styles
- 1 hero image showcasing luxury design
- High-end DALL-E quality
```

Bot will:
1. Parse your request
2. Call `generate_product_image` tool 5 times
3. Return image URLs
4. Queue database save commands

---

### **Option 3: Scheduled Execution (Cron Job)**

For periodic image generation (daily, weekly):

```bash
# Add to Railway > kealee-platform-v10 > Variables:
GENERATION_SCHEDULE="0 2 * * 0"  # Weekly on Sunday at 2 AM UTC

# Then create cron service in background
echo "0 2 * * 0 curl -X POST https://arstic-kindness.up.railway.app/admin/generate-images -H 'X-API-Key=...'" | crontab -
```

---

## 📊 GENERATION WORKFLOW BREAKDOWN

### **What Happens When You Trigger Generation:**

```
1. POST /admin/generate-images
2. API validates admin key
3. Fetch all products (or specified product)
4. Create generation jobs (27 products × 6 images = 162 jobs)
5. Return response immediately (non-blocking)
6. Background: Start processing jobs asynchronously

For each product:
  │
  ├─ For each style (modern, contemporary, traditional, transitional, luxury):
  │  │
  │  ├─ Call Claude via Anthropic API
  │  │  └─ KeaBot-Design system prompt
  │  │  └─ Instruction: Call generate_product_image tool
  │  │
  │  ├─ Tool call: generate_product_image
  │  │  └─ Call DALL-E 3 API
  │  │  └─ Generate before image
  │  │  └─ Return URL + save command
  │  │
  │  └─ Tool call: generate_product_image
  │     └─ Call DALL-E 3 API
  │     └─ Generate after image
  │     └─ Return URL + save command
  │
  └─ POST to /api/product-images
     └─ Save all images to database
     └─ Log completion

Final: KeaBot-Design logs: ✅ Generated 162 images for 27 products
```

---

## 💰 COST BREAKDOWN

| Item | Rate | Qty | Cost |
|------|------|-----|------|
| DALL-E 3 (1024x1024) | $0.04/image | 162 | $6.48 |
| API Calls | Free | 27 | $0 |
| Database Storage | ~$0.10/GB | ~50MB | ~$0.01 |
| **TOTAL** | | | **~$6.50** |

For subsequent runs (updates), only generate new products/types.

---

## 📱 DISPLAYING IMAGES IN PRODUCTS

### **Update Next.js Product Page component:**

```typescript
// apps/m-architect/src/components/ProductCard.tsx

import Image from 'next/image';
import { Carousel } from '@/components/ui/carousel';
import { db } from '@kealee/database';

export default async function ProductCard({ productId }: { productId: string }) {
  // Fetch product images
  const images = await db.productImage.findMany({
    where: { productId },
    orderBy: { generatedAt: 'desc' },
  });

  if (!images.length) {
    return <div className="placeholder">Loading images...</div>;
  }

  // Group by type
  const beforeAfter = images.filter(img => ['before', 'after'].includes(img.type));
  const showcase = images.filter(img => ['hero', 'trend', 'detail'].includes(img.type));

  return (
    <div className="product-card">
      {/* Before/After Carousel */}
      {beforeAfter.length > 0 && (
        <section>
          <h3>See the Transformation</h3>
          <Carousel>
            {beforeAfter.map(img => (
              <Image
                key={img.id}
                src={img.url}
                alt={`${img.type} - ${img.style}`}
                width={600}
                height={400}
                className="rounded-lg"
              />
            ))}
          </Carousel>
        </section>
      )}

      {/* Showcase Section */}
      {showcase.length > 0 && (
        <section>
          <h3>Design Inspiration</h3>
          <div className="grid grid-cols-2 gap-4">
            {showcase.map(img => (
              <Image
                key={img.id}
                src={img.url}
                alt={`${img.type} - ${img.style}`}
                width={300}
                height={300}
                className="rounded-lg"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

---

## ✅ VERIFICATION CHECKLIST

After triggering generation:

- [ ] Check Railway logs for `[keabot-design] ✅ Generated` messages
- [ ] Status endpoint shows images > 0
- [ ] Images load in product pages
- [ ] Before/after carousel works
- [ ] No duplicate image styles
- [ ] All 27 products have images

---

## 🔧 TROUBLESHOOTING

### **"OPENAI_API_KEY not set"**
```bash
# Add to Railway variables:
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
```

### **Images not displaying**
```bash
# Check:
1. Images are saved: GET /admin/generate-images/status
2. URLs are valid: Visit image URL in browser
3. CORS enabled for image domain
4. Product card component updated
```

### **Generation taking too long**
```bash
# Each image is 10-30 seconds
# 162 images = 30-90 minutes total
# Check logs for progress:
tail -f /var/log/railway/keabot-design.log | grep "keabot-design"
```

### **Agent "doesn't understand" the request**
- Agent requires explicit `product_id`, `image_type`, `description`, `style`
- Don't use vague prompts ("make it pretty")
- Use template: "Generate a **before** image for **kitchen-remodel** in **modern** style: A dated kitchen with old cabinets..."

---

## 🎯 NEXT STEPS

1. **Deploy Code**: Push all changes to git → Railway auto-deploys
2. **Add API Keys**: Add ADMIN_API_KEY and API_SERVICE_KEY to Railway
3. **Run Dry-Run**: Execute with `?dryRun=true` to preview
4. **Trigger Generation**: Execute full generation (5-10 minutes, ~$6.50)
5. **Update Product Pages**: Deploy product card component updates
6. **Test**: Visit product pages, verify images display

---

## 📞 AGENT EXECUTION SUMMARY

| Method | When to Use | Command |
|--------|------------|---------|
| **Auto (Recommended)** | One-time full generation | `curl POST /admin/generate-images` |
| **Prompt-Based** | Testing, interactive refinement | Message KeaBot-Design directly |
| **Scheduled** | Weekly/monthly refresh | Add cron job to Railway |
| **API Call** | Custom logic, integrations | `POST /admin/generate-images` |

**Agent Status:** ✅ Ready to execute (requires OPENAI_API_KEY + ADMIN_API_KEY on Railway)

