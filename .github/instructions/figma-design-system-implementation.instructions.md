---
name: figma-design-system-implementation
description: "Use when: continuing Figma design system implementation (Phase 3), building component libraries, creating design documentation, or managing UI/UX for Kealee Platform. Applies to all frontend/design work requiring consistency with verified design tokens and component specifications."
applyTo: "**/*.figma*, **/*design*, **/ui/*, **/component*, **/style*"
---

# Figma Design System Implementation Instructions

## Context

**Project:** Kealee Platform v10/v20 - Full-Lifecycle Construction Platform  
**Current Status:** Phase 2 Complete (32 colors + 13 text styles in Figma Assets)  
**Current File:** `mhmydzsUHbQzGanUIdHHoQ` (Kealee-cursor design file)  
**Token:** `FIGMA_TOKEN_REDACTED` ✅ Active

---

## Prerequisites

Before starting any design work:

1. **Verify Design System is Loaded**
   - Figma file open: mhmydzsUHbQzGanUIdHHoQ
   - Assets panel visible with:
     - ✅ 32 colors (Primary, Secondary, Semantic, Neutral)
     - ✅ 13 text styles (Display, Heading, Body, Label)
   - Run verification if needed: `node verify-figma-setup.js`

2. **Reference Documentation Available**
   - `KEALEE_FIGMA_DESIGN_SPECIFICATION.md` (60+ pages - design specs)
   - `FIGMA_COMPLETE_SETUP_GUIDE.md` (40+ pages - detailed setup)
   - `figma-tokens.json` (design token values)
   - `PHASE_3_READY.md` (Phase 3 execution checklist)

3. **Token Management**
   - Token stored in `.figma-config.json`
   - Check expiry via Figma settings if API calls fail
   - Rotate protocol: Generate new token → Update config → Retry

---

## Phase 3 Execution Framework

### Milestone 1: Build Component Main Components (1-2 hours)

**Required Components (MVP):**
```
1. Button
   ├── Sizes: Small (32px), Medium (40px), Large (48px)
   ├── Variants: Primary, Secondary, Tertiary
   ├── States: Default, Hover, Active, Disabled, Loading
   └── Assign colors from Assets → Use Primary colors

2. Input (Text Field)
   ├── States: Default, Focused, Error, Disabled
   ├── Include label, input area, helper text
   └── Use Neutral colors + Semantic error states

3. Card
   ├── Layouts: Default, Elevated (shadow), Filled (background)
   ├── Includes: Header, body, footer sections
   └── Use Shadow tokens for elevation

4. Badge
   ├── All semantic variants: Success, Warning, Error, Info
   ├── Sizes: Small, Medium
   └── Use Semantic colors directly

5. Modal/Dialog
   ├── Main component with overlay background
   ├── Header, body, footer
   └── Optional: Close button, action buttons

6. Additional Components (as time permits):
   ├── Checkbox / Radio Button
   ├── Toggle Switch
   ├── Progress Bar
   ├── Toast/Alert
   └── Avatar
```

**Component Creation Process:**
1. Draw shape with correct dimensions
2. Apply fill color from Assets (drag color into fills)
3. Apply text style from Assets (select text → choose style)
4. Create component: Right-click → "Create component"
5. Add properties: Right panel → Component settings
6. Create variants for different states/sizes
7. Test: Create instances and verify styling

---

### Milestone 2: Interactive Prototypes (30 min - 1 hour)

**Key Interactions to Build:**
```
Button Interactions:
├── Hover → Scale slight grow + color shift
├── Click → Press state animation
├── Disabled → Opacity change + cursor not-allowed
└── Loading → Spinner icon animation

Modal Flow:
├── Trigger: Button click → Modal appears
├── Open: Fade in + scale animation
├── Close: Button click → Fade out
└── Overlay: Click outside to close

Form Interactions:
├── Input focus → Blue border + shadow
├── Input error state → Red border + error message
└── Success state → Green checkmark
```

**Figma Prototype Steps:**
1. Select component instance → Right panel → Prototype
2. Add interaction: Click/Hover/Drag
3. Choose animation: Instant / Dissolve / Smart Animate
4. Test with ▶️ preview button

---

### Milestone 3: Documentation Pages (1 hour)

**Required Documentation Frames:**

1. **Design System Overview**
   - Title, description, brand values
   - 4 key principles
   - Link to components

2. **Color System**
   - Primary colors (10 shades) - arranged by value
   - Secondary colors (8 shades)
   - Semantic colors (Success, Warning, Error, Info)
   - Neutral/Gray scale (10 shades)
   - Include hex values for developer reference

3. **Typography**
   - All 13 styles with specs:
     - Font family (Inter)
     - Size, weight, line height
     - Use case examples
   - Show full alphabet in each style

4. **Components**
   - One section per component
   - Show all states/variants
   - Usage guidelines
   - Dos and Don'ts

5. **Guidelines**
   - Spacing rules (8px grid system)
   - Padding/margin conventions
   - Shadow usage
   - Accessibility notes
   - Implementation for developers

6. **Module Themes**
   - Show 10 modules with their primary/accent colors
   - Include hex values
   - Use case for each module

---

### Milestone 4: Team Setup & Export (30 min)

**Publishing for Team:**
1. Publish component library: Assets → Publish
2. Generate share link: File → Share
3. Export design tokens:
   - Use plugin or manual export
   - Include CSS variables, JSON, React constants
4. Create implementation guide for developers

---

## Design Token Reference

All values available in `figma-tokens.json` and can be found in Assets panel:

**Colors (32 total):**
- Primary: 10 shades (#eff6ff to #1e3a8a)
- Secondary: 8 shades (#fff7ed to #c2410c)
- Semantic: 4 colors (Success: #10b981, Warning: #f59e0b, Error: #ef4444, Info: #3b82f6)
- Neutral: 10 shades (#f9fafb to #111827)

**Typography (13 total):**
- Display/Hero: 60px Bold, 48px Bold
- Headings: 36px, 30px, 24px, 20px (Bold)
- Body: 18px, 16px, 14px, 12px (Regular)
- Labels: 18px, 14px, 12px (Medium)

**Spacing:**
- Base unit: 8px
- Padding: 4px, 8px, 12px, 16px, 20px, 24px
- Margin: same as padding
- Border radius: 4px (input), 8px (button), 12px (card)

**Shadows:**
- Light: 0 1px 3px rgba(0,0,0,0.1)
- Medium: 0 4px 12px rgba(0,0,0,0.15)
- Large: 0 10px 25px rgba(0,0,0,0.2)

---

## Module Themes (10 apps)

When creating components, remember module-specific themes:

```
1. marketplace       → Primary: #2563eb (Blue), Accent: #f97316 (Orange)
2. projectOwner      → Primary: #2563eb (Blue), Accent: #10b981 (Green)
3. architect         → Primary: #4f46e5 (Indigo), Accent: #f97316 (Orange)
4. engineer          → Primary: #0891b2 (Cyan), Accent: #f97316 (Orange)
5. permitsInspections→ Primary: #7c3aed (Violet), Accent: #10b981 (Green)
6. financeTrust      → Primary: #2563eb (Blue), Accent: #2563eb (Blue)
7. inspector         → Primary: #0891b2 (Cyan), Accent: #10b981 (Green)
8. pm                → Primary: #2563eb (Blue), Accent: #f97316 (Orange)
9. admin             → Primary: #111827 (Gray), Accent: #f97316 (Orange)
10. opsServices      → Primary: #2563eb (Blue), Accent: #f97316 (Orange)
```

Use Primary color for buttons, accents; keep components neutral-colored for module flexibility.

---

## Best Practices

### Component Building
- ✅ Always apply styles from Assets (drag colors, select text styles)
- ✅ Use constraints for responsive behavior
- ✅ Test components at different sizes
- ✅ Create main component once, then variants
- ✅ Document component usage in frames
- ❌ Don't hardcode colors (use Assets)
- ❌ Don't create duplicate components
- ❌ Don't forget accessibility labels

### Documentation
- ✅ Show all variants and states
- ✅ Include hex values and sizes
- ✅ Provide clear usage examples
- ✅ Add accessibility notes
- ✅ Keep text readable and scannable
- ❌ Don't assume developer knowledge
- ❌ Don't skip edge cases or error states

### Team Collaboration
- ✅ Publish library regularly
- ✅ Keep naming consistent
- ✅ Version components (v1, v2 if major changes)
- ✅ Share with team early
- ✅ Gather feedback before finalization
- ❌ Don't share incomplete components

---

## File Structure

**Key Files in Workspace:**
```
kealee-platform-v10/
├── figma-tokens.json              # Design token source of truth
├── KEALEE_FIGMA_DESIGN_SPECIFICATION.md   # 60+ page reference
├── FIGMA_COMPLETE_SETUP_GUIDE.md  # Detailed implementation
├── PHASE_3_READY.md               # Phase 3 checklist
├── PLUGIN_METHOD_GUIDE.md         # Plugin loading guide
├── figma-plugin-manifest.json     # Plugin config
├── figma-plugin-code.js           # Plugin code
├── figma-plugin-ui.html           # Plugin UI
├── FIGMA_SETUP_REPORT.md          # Phase 1/2 results
└── .figma-config.json             # Config + progress tracking
```

---

## Troubleshooting

### Styles Not Applying
- [ ] Verify Assets panel shows colors/typography
- [ ] Refresh Figma (Ctrl+R / Cmd+R)
- [ ] Run plugin again if needed
- [ ] Try manual application from Assets

### Component Not Creating Properly
- [ ] Ensure all child elements are grouped
- [ ] Make sure no locked layers
- [ ] Use "Create component" from right-click menu
- [ ] Check constraints are set correctly

### Colors Look Wrong
- [ ] Check hex values in figma-tokens.json
- [ ] Verify color mode is RGB (not sRGB profile)
- [ ] Refresh screen/reopen file
- [ ] Compare with design spec

### Prototype Interactions Not Working
- [ ] Verify prototype mode is enabled (top panel)
- [ ] Check both source and target are selected
- [ ] Ensure animation type is appropriate
- [ ] Test with preview (▶️ button)

---

## Definition of Done (Phase 3 Complete)

✅ All 6+ components built with main component + variants  
✅ All component states functioning (hover, active, disabled, etc.)  
✅ 3-5 interactive flows working in prototype mode  
✅ 6 documentation pages created with guidelines  
✅ Design tokens exported for developers  
✅ Team has access to shared file  
✅ Component library published  
✅ No color hardcoding - all from Assets  
✅ All naming conventions followed  
✅ Ready for developer handoff  

---

## Next Steps

1. **Verify** colors + typography in Assets ✓
2. **Create** first component (Button) as POC
3. **Build** remaining components (1-2 hrs)
4. **Add** interactive prototypes (30 min - 1 hr)
5. **Document** design system (1 hr)
6. **Export** and share with team (30 min)

**Expected Time:** 2-4 hours for complete Phase 3

---

**When stuck:** Check KEALEE_FIGMA_DESIGN_SPECIFICATION.md for detailed specs, or FIGMA_COMPLETE_SETUP_GUIDE.md for step-by-step help.
