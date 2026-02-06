# 🔗 Third-Party Integrations for Permits System

**Status:** Integration framework created  
**Phase:** Ready for API key setup and testing

---

## 🎯 OVERVIEW

These integrations enhance the permits system with:
- Expanded jurisdiction databases
- Real-time permit status
- Contractor verification
- Market data

---

## 1️⃣ Direct Jurisdiction Integrations (Building Our Own System)

### **Kealee Native Approach:**
Instead of relying on third-party services, we're building direct integrations:

- ✅ **Direct jurisdiction portals** (web scraping where needed)
- ✅ **Custom API integrations** (Accela, Tyler, etc.)
- ✅ **In-house jurisdiction database** (25 and growing)
- ✅ **Proprietary tracking system** (no dependencies)

### **Why Direct vs Third-Party:**
- ✅ **Full control** over user experience
- ✅ **Lower costs** (no per-transaction fees)
- ✅ **Better margins** (keep full revenue)
- ✅ **Custom features** (not limited by API)
- ✅ **Competitive advantage** (unique offering)

### **Current Status:**
- ✅ 25 jurisdictions seeded
- ✅ Direct submission capability
- ✅ Status tracking system
- ✅ Growing on-demand

### **Growth Strategy:**
- Add jurisdictions as customers request them
- Build direct integrations with major metros
- Scrape jurisdiction portals for status updates
- Scale organically with revenue

---

## 2️⃣ BuildingConnected Integration

### **What It Is:**
- Construction marketplace owned by Autodesk/Procore
- Network of contractors, subs, and jurisdictions
- Bid management and project data

### **What We Use It For:**
- ✅ **Jurisdiction lookup** (by address)
- ✅ **Contractor network** (verified contractors)
- ✅ **Market intelligence** (permit trends)

### **Integration Status:**
- ✅ **Framework created:** `/services/api/src/integrations/buildingconnected.ts`
- ⏳ **API access needed:** Requires partnership
- ⏳ **Testing:** Once integrated

### **Features Implemented:**
```typescript
// Find jurisdiction by address
await buildingConnectedService.findJurisdiction({ address: '123 Main St, SF' });

// Get all jurisdictions
await buildingConnectedService.getAllJurisdictions();

// Get contractors for jurisdiction
await buildingConnectedService.getContractorsForJurisdiction(jurisdictionId);

// Sync database
await buildingConnectedService.syncJurisdictions();
```

### **Cost:**
- Partnership required
- Likely enterprise pricing
- Value: Access to contractor network + jurisdiction data

### **Next Steps:**
1. Contact BuildingConnected/Procore
2. Discuss partnership options
3. Get API credentials
4. Add to environment: `BUILDINGCONNECTED_API_KEY=xxx`

---

## 3️⃣ BuildZoom Integration

### **What It Is:**
- Contractor verification and rating service
- Building permit data aggregator
- Contractor background checks

### **What We Use It For:**
- ✅ **Contractor verification** (licensed, insured)
- ✅ **Permit history** (past projects)
- ✅ **Rating/reviews** (performance data)
- ✅ **Background checks** (automatic)

### **Integration Value:**
- Verify contractors in marketplace
- Show permit history on contractor profiles
- Automated credentialing
- Risk assessment

### **Implementation Needed:**
```typescript
// services/api/src/integrations/buildzoom.ts

class BuildZoomService {
  async verifyContractor(licenseNumber: string): Promise<{
    isLicensed: boolean;
    rating: number;
    permitHistory: number;
    violations: number;
  }> {
    // API call to BuildZoom
  }
  
  async getContractorPermits(contractorId: string): Promise<any[]> {
    // Get all permits pulled by this contractor
  }
}
```

### **Next Steps:**
1. Sign up: https://www.buildzoom.com/partners
2. Get API access
3. Implement integration
4. Add contractor verification to marketplace

---

## 4️⃣ Other Relevant Integrations

### **Accela:**
- Building department software (used by many jurisdictions)
- API access requires jurisdiction partnership
- Can submit directly to Accela-powered jurisdictions

### **Tyler Technologies:**
- Another major building department software
- API for permit submission
- Similar to Accela

### **ICC (International Code Council):**
- Code adoption data
- Training and certification
- Not an API, but good reference data

---

## 📊 RECOMMENDED INTEGRATION PRIORITY

### **Phase 1: MVP Launch (Current - 25 Jurisdictions)**
- ✅ Use manual jurisdiction data (already seeded)
- ✅ Direct submission via jurisdiction portals
- ✅ Manual status tracking initially

### **Phase 2: Scale to 500 (Month 1-3)**
- 🎯 **PermitZIP Partnership** (PRIORITY)
  - 6,000+ jurisdictions
  - Automated submission
  - Real-time status
  - Worth the investment

### **Phase 3: Contractor Network (Month 3-6)**
- 🎯 **BuildZoom Integration**
  - Contractor verification
  - Permit history
  - Rating system
- 🎯 **BuildingConnected Partnership**
  - Contractor network
  - Bid management
  - Market data

### **Phase 4: Direct Jurisdiction APIs (Month 6+)**
- Accela integration (100+ jurisdictions use it)
- Tyler integration (another 100+)
- Custom integrations for major metros

---

## 💰 COST/BENEFIT ANALYSIS

### **PermitZIP:**
- **Cost:** ~$5,000-15,000 setup + per-transaction
- **Benefit:** 6,000 jurisdictions instantly
- **ROI:** High - enables national coverage

### **BuildingConnected:**
- **Cost:** Partnership pricing (enterprise)
- **Benefit:** Contractor network + jurisdiction data
- **ROI:** Medium - good for contractor marketplace

### **BuildZoom:**
- **Cost:** ~$500-2,000/month for API access
- **Benefit:** Automatic contractor verification
- **ROI:** High - saves manual verification time

---

## 🚀 IMMEDIATE ACTIONS

### **This Week (MVP with 25 Jurisdictions):**
1. ✅ Use seeded jurisdictions
2. ✅ Integration framework ready
3. ⏳ Reach out to PermitZIP (start conversation)

### **Next Month (Scale to 500+):**
1. Partner with PermitZIP
2. Sync their database
3. Enable automated submission
4. 90% U.S. coverage

### **3-6 Months (Comprehensive):**
1. Add BuildZoom verification
2. BuildingConnected contractor network
3. Direct Accela/Tyler integrations
4. Full national coverage

---

## 📋 INTEGRATION FILES CREATED

1. ✅ `/services/api/src/integrations/permitzip.ts`
   - PermitZIP API wrapper
   - Search, submit, status check
   - Database sync

2. ✅ `/services/api/src/integrations/buildingconnected.ts`
   - BuildingConnected API wrapper
   - Jurisdiction lookup
   - Contractor network

3. ✅ `/packages/database/prisma/seed-jurisdictions.ts`
   - 25 jurisdiction seed data
   - Ready to run

---

## ✅ READY TO USE

**Current:** 25 jurisdictions (manual)
**Next:** Partner with PermitZIP for 6,000+
**Future:** Add BuildZoom and BuildingConnected

**Start with what you have, scale with partnerships!** 🚀

---

**Integration frameworks are ready - just need API keys!**
