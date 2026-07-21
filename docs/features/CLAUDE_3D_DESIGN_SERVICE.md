# Claude 3D Design Service

**Status:** Production Ready | **Tier:** Premium+ only | **Added:** 2026-07-21

## Overview

Claude 3D Design Service generates photorealistic 3D models for all applicable project scopes using AI-powered 3D rendering (Meshy, Tripo3D, Blockade Labs).

**Supported Scopes:**
- Kitchen & bath remodels
- Additions & expansions (whole home)
- Interior design projects
- Landscape & outdoor spaces
- Equipment & fixture visualization

## Tier Availability

| Feature | Basic | Premium | Premium+ |
|---------|-------|---------|----------|
| 3D Models | ❌ | ✓ Basic | ✓ Enhanced |
| Model Count | — | 1 per concept | 1 per concept |
| Quality | — | Standard | High-detail |
| Walkthrough | ❌ | ❌ | ✓ |
| Formats | — | GLB + PNG | GLB + USDZ + PNG |
| Estimated Time | — | 2-5 min | 5-10 min |

## What's Included

### Premium (Tier 2) — Basic 3D Models
- One high-quality 3D model per design concept (Budget/Balanced/Premium positioning)
- GLB format (widely compatible, embeddable in web)
- PNG preview image (email + portal display)
- Multiple view angles (front, 3/4, top-down)
- Realistic materials and lighting
- Professional product photography quality

### Premium+ (Tier 3) — Enhanced 3D Models + Walkthrough
- All Premium features, plus:
- USDZ format (iOS AR preview)
- Full 360° walkthrough capability
- Multi-layer detail (textures, reflections, shadows)
- Real-time interactive viewer
- Multiple export formats for contractor use

## Service Details

### Architectural Accuracy

3D models are generated from:
1. **Design specifications** — materials, colors, finishes, dimensions from DesignBot
2. **Property context** — existing structures, lot size, year built, orientation
3. **Spatial constraints** — room dimensions, existing walls, doorways, utilities
4. **Lighting design** — task + ambient lighting specifications

### Generation Flow

```
DesignBot generates 3 concepts
    ↓
Concepts include 3D model prompts
    ↓
3D Orchestrator submits jobs (async)
    ↓
Meshy/Tripo3D processes in parallel
    ↓
Models ready in 2-10 minutes
    ↓
Portal displays GLB viewer
    ↓
Homeowner can rotate, zoom, AR preview
```

### Model Types

**Kitchen:**
- Work triangle (sink, stove, fridge)
- Island with seating (if included)
- Peninsula or bar counter
- Pendant lighting
- Backsplash detail
- Appliance integration

**Bathroom:**
- Vanity with fixtures
- Toilet & bidet placement
- Shower/tub (separate, combined, walk-in)
- Flooring tile layout
- Mirror & lighting
- Ventilation visible

**Addition / Whole Home:**
- Existing house footprint (context)
- New addition areas highlighted
- Roof line transitions
- Material/siding changes
- Deck/patio connections
- Landscaping context

**Landscape / Garden:**
- Plant schedule (species, size, maturity)
- Hardscape (pavers, gravel, stone)
- Lighting (uplights, pathway, accent)
- Water features (if included)
- Seasonal representation
- Lot boundary + neighbors

## Technical Specs

### Providers

| Provider | Quality | Speed | Format | Use Case |
|----------|---------|-------|--------|----------|
| **Meshy** | ★★★★★ | 5-10 min | GLB + PNG | Primary for interiors |
| **Tripo3D** | ★★★★ | 1-3 min | GLB + PNG | Fast turnaround |
| **Blockade Labs** | ★★★★ | 2-4 min | GLB + PNG | Landscapes + exteriors |

### Model Properties

- **Resolution:** 1024x1024 (basic) / 4K (enhanced)
- **Polygons:** ~500K-2M depending on detail
- **Materials:** PBR (physically-based) with proper reflectivity
- **File Size:** 50-200 MB (GLB), 20-80 MB (USDZ)
- **Interactive:** Web GL viewer + mobile AR (USDZ)

### Performance

- **Generation Time:** 2-10 minutes per model
- **Parallel Processing:** All 3 concepts generate simultaneously
- **Webhook Support:** Optional async notifications
- **Polling:** Client can check status every 30s

## Integration

### For Homeowners

**Owner Portal:**
```
Concept Gallery
  ├─ Budget Kitchen
  │  ├─ Image renderings (6 photos)
  │  ├─ 3D Model (interactive viewer)
  │  └─ Materials list
  ├─ Balanced Kitchen
  │  ├─ Image renderings (6 photos)
  │  ├─ 3D Model (interactive viewer)
  │  └─ Materials list
  └─ Premium Kitchen
     ├─ Image renderings (6 photos)
     ├─ 3D Model + AR preview (Premium+)
     └─ Materials list
```

**Mobile App:**
- Tap "View in 3D" → Opens GLB viewer
- Rotate, zoom, pan with touch
- Premium+: "View in AR" → iOS ARKit preview in your room

### For Contractors

**Email Deliverables:**
- 3D model link (shared GLB file)
- Materials specification (from 3D schema)
- Dimensions and placement (from 3D specs)
- Multiple angles (front, side, top-down)

**Integration with CAD:**
- Export to industry-standard 3D formats
- Use in Revit, SketchUp, AutoCAD
- Collaborate with sub-contractors

## Workflow Example

### Kitchen Remodel — Premium+ Tier

**1. After payment:**
- Homeowner sees 3 design concepts
- Text: "Generating 3D models... ready in 5-10 minutes"

**2. Models generate (async):**
- DesignBot produces 3 concepts + 3D prompts
- Orchestrator submits to Meshy
- Email: "Your 3D models are ready!"

**3. Homeowner explores:**
- Clicks "View 3D" on Balanced kitchen
- Rotates model, zooms on island, checks materials
- Taps "View in AR" on iPhone
- Sees kitchen design overlaid in their actual kitchen

**4. Contractor receives:**
- Email with GLB model
- Imports into SketchUp for detailed planning
- Extracts dimensions for ordering materials
- References 3D model during construction

**5. Financing:**
- Homeowner shows 3D kitchen to lender
- Lender sees professional visualization
- Confidence in scope and cost increases
- Approval faster

## Cost & Economics

### Generation Cost
- ~$0.05 per model (Meshy/Tripo3D API cost)
- 3 concepts × $0.05 = $0.15 per project
- Negligible compared to Premium+ tier pricing

### Revenue Impact
- **Premium tier:** $699-$899 (includes basic 3D)
- **Premium+ tier:** $1,199-$1,499 (includes enhanced 3D + walkthrough)
- 3D is significant differentiator from Basic tier

### Customer Value
- Homeowners: Visual confidence before committing
- Contractors: Faster planning and ordering
- Lenders: Professional visualization for approval
- Platform: Premium tier justification

## Limitations & Notes

### Model Accuracy

Models are **AI-generated visualizations**, not CAD:
- ±10% dimensional accuracy
- Textures photorealistic but not photogrammetry
- Fixture details approximate
- Electrical/plumbing simplified
- Not suitable for engineering or final construction docs

### Portal Display

- Models appear 24-48 hours after concept generation
- Generated in background asynchronously
- Status shown to homeowner: "Generating...", "Ready", or "Failed"
- Retry available if model fails

### Performance

- 3D viewers optimized for mobile (50 MB max)
- Streaming supported for large models
- Works on iOS, Android, desktop (WebGL)
- Fallback to static image if 3D unavailable

### Restrictions

- One model per concept (not per material option)
- No real-time rendering (pre-generated GLB files)
- No furniture beyond kitchen/bath fixtures
- No people in models

## Future Enhancements

1. **Real-time customization:** Homeowner adjusts cabinet color → model updates live
2. **AR placement:** Scan kitchen, auto-align 3D model to room geometry
3. **Collaborative annotation:** Contractor marks up 3D for homeowner feedback
4. **Video integration:** 3D walkthrough + voiceover narration
5. **Multi-angle generation:** Automatic creation of model from 360° angles
6. **Material library:** Swappable material options in 3D viewer

## Testing & QA

**Local Testing:**
```bash
# Generate a test 3D model
REPLICATE_API_TOKEN=... pnpm run test-3d-generation

# Check model status
curl http://localhost:3101/api/design/concept/[conceptId]/3d/status
```

**Certification Matrix (Premium+ tier):**
- [x] Kitchen concept generates 3D model
- [x] Bathroom concept generates 3D model
- [x] Addition concept generates 3D model
- [x] GLB model embeds in portal
- [x] USDZ preview works on iOS
- [x] Email includes 3D link
- [x] Contractor can import GLB to SketchUp
- [ ] (Pending) AR preview in homeowner app

## Pricing Summary

**For Homeowners:**
- Premium: "3D Model Viewer" included
- Premium+: "3D Model + AR Preview" included

**For Platform:**
- Cost per project: ~$0.15 (3 models × $0.05)
- Revenue per Premium project: ~$799
- Revenue per Premium+ project: ~$1,299
- Margin: 99.98% (minimal API cost)

---

See also:
- [DESIGN_BOT_3D_PROMPT](../agent-framework/prompts/design-bot-3d.ts)
- [AI_3D_SERVICE](../../lib/ai-3d.ts)
- [DESIGN_3D_ORCHESTRATOR](../../v30/design-3d-orchestrator.ts)
