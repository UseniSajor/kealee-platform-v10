---
name: Phase 3 Figma Component Library Creation
description: Execute Phase 3 of Figma Design System implementation - building component libraries, interactive prototypes, and design documentation for Kealee Platform UI/UX.
---

# Phase 3: Figma Component Library & UI/UX Implementation

## Quick Summary

**What:** Build complete component library, prototypes, and documentation  
**Where:** Figma file `mhmydzsUHbQzGanUIdHHoQ` (Kealee-cursor)  
**Token:** `FIGMA_TOKEN_REDACTED` ✅  
**Time:** 2-4 hours  
**Status:** Phase 2 complete (colors + typography deployed)

---

## 🎯 This Prompt's Task

Execute the following in sequence with detailed output:

### TASK 1: Verify Design System Load (5 min)
```
1. Check Figma Assets panel
2. Confirm 32 colors visible
3. Confirm 13 text styles visible
4. Report: "✅ Design System Verified"
```

### TASK 2: Create Button Component (30 min)
```
Create: Button/Primary component with:
├── Sizes: Small (32px), Medium (40px), Large (48px)
├── States: Default, Hover, Active, Disabled
├── Apply Primary-600 color from Assets
├── Apply "Heading/XL" text style from Assets
├── Create variants for each size and state
└── Test by creating 3 instances (default, hover, disabled)

Report: Button component created with X variants
```

### TASK 3: Create 4 More Core Components (1 hour)
```
Components to build:
1. Input/Text - with focused and error states
2. Card - with default, elevated, filled variants
3. Badge - with all semantic variants (Success, Warning, Error, Info)
4. Modal - with overlay and action buttons

For each:
├── Apply colors from Assets
├── Apply typography from Assets
├── Create variants
├── Test with instances
└── Document in frame

Report: 5 components created (Button + 4 others)
```

### TASK 4: Create Interactive Prototypes (30 min)
```
Build interactions:
1. Button click → Scale animation → Back to default
2. Input focus → Blue border highlight
3. Modal → Button click opens modal with overlay
4. Badge → Hover effect (slight scale)

For each:
├── Select component instance
├── Right panel → Prototype tab
├── Add interaction
├── Choose animation
└── Test with ▶️ preview

Report: X interactive flows created and tested
```

### TASK 5: Create Documentation (1 hour)
```
Build frames:
1. Design System Overview - title + 4 principles + component list
2. Color System - all 32 colors with hex values
3. Typography - all 13 styles with specs
4. Components - showcase all built components with states
5. Guidelines - spacing, shadows, accessibility notes
6. Module Themes - 10 app themes with colors

Each frame should:
├── Include title and description
├── Show examples
├── Include developer reference info (hex, sizes)
└── Be organized and scannable

Report: 6 documentation pages created
```

### TASK 6: Team Setup & Export (30 min)
```
1. Publish component library:
   └─ Assets → Publish component library

2. Share file:
   └─ File → Share → Generate link

3. Export design tokens:
   └─ Figma → Export → CSS/JSON with variables

4. Create handoff guide:
   └─ Document: "How developers use this design system"

Report: Library published, file shared, tokens exported
```

---

## 📋 Detailed Component Specifications

### Button Component
```yaml
Sizes:
  Small:
    height: 32px
    padding: 6px 12px
    font-size: 12px
  Medium:
    height: 40px
    padding: 8px 16px
    font-size: 14px
  Large:
    height: 48px
    padding: 12px 20px
    font-size: 16px

Variants:
  Primary: Fill with Primary-600, text white
  Secondary: Fill with Primary-100, text Primary-600
  Tertiary: No fill, text Primary-600, border 1px

States:
  Default: Base styling
  Hover: 20% darker background
  Active: 30% darker + slight inset shadow
  Disabled: Opacity 50%, cursor not-allowed
  Loading: Replace text with spinner icon
```

### Input Component
```yaml
Structure:
  - Label (optional)
  - Input field (32px - 48px height)
  - Helper text (optional)
  - Error message (red, appears on error state)

States:
  Default: Neutral-200 border, white background
  Focused: Primary-600 border, blue glow shadow
  Error: Semantic Error border, light red background
  Disabled: Gray background, opacity 50%

Colors:
  Background: White
  Border default: Neutral-300
  Border focused: Primary-600
  Border error: Semantic Error
  Text: Neutral-900
```

### Card Component
```yaml
Layout:
  - Header (optional): 16px padding, darker background
  - Body: 16px padding, content area
  - Footer (optional): 12px padding, action buttons

Variants:
  Default: White background, thin border
  Elevated: White background, medium shadow
  Filled: Light gray background (Neutral-50), no border

Colors:
  Background: White (default/elevated) or Neutral-50 (filled)
  Border: Neutral-200 (default only)
  Shadow: Medium (elevated)

Border radius: 12px
```

### Badge Component
```yaml
Sizes:
  Small: 20px height, 6px padding
  Medium: 24px height, 8px padding

Variants (by semantic color):
  Success: Green background (#10b981), white text
  Warning: Orange background (#f59e0b), white text
  Error: Red background (#ef4444), white text
  Info: Blue background (#3b82f6), white text

Typography: Label/SM or Label/Base
Border radius: 16px (fully rounded)
```

### Modal Component
```yaml
Structure:
  - Overlay: Dark semi-transparent background
  - Modal box: White card with shadow
  - Header: Title + close button
  - Body: Content area
  - Footer: Action buttons

Sizing:
  Modal: 512px width (responsive on mobile)
  Max height: 80vh
  Padding: 24px

Colors:
  Overlay: Black 40% opacity
  Modal: White background
  Header background: Neutral-50

Animations:
  Open: Fade in + scale up
  Close: Fade out + scale down
```

---

## 🎨 Color Reference (from Assets)

**Primary Colors (10):**
```
Primary-50:   #eff6ff
Primary-100:  #dbeafe
Primary-200:  #bfdbfe
Primary-300:  #93c5fd
Primary-400:  #60a5fa
Primary-500:  #3b82f6
Primary-600:  #2563eb  ← Main brand color
Primary-700:  #1d4ed8
Primary-800:  #1e40af
Primary-900:  #1e3a8a
```

**Semantic Colors (4):**
```
Success:  #10b981
Warning:  #f59e0b
Error:    #ef4444
Info:     #3b82f6
```

**Neutral/Gray (10):**
```
Gray-50:   #f9fafb
Gray-100:  #f3f4f6
Gray-200:  #e5e7eb  ← Default border
Gray-300:  #d1d5db
Gray-400:  #9ca3af
Gray-500:  #6b7280
Gray-600:  #4b5563
Gray-700:  #374151
Gray-800:  #1f2937
Gray-900:  #111827  ← Main text
```

---

## 📚 Reference Files

**In workspace:**
- `KEALEE_FIGMA_DESIGN_SPECIFICATION.md` (full specs)
- `FIGMA_COMPLETE_SETUP_GUIDE.md` (step-by-step)
- `figma-tokens.json` (token values)
- `.github/instructions/figma-design-system-implementation.instructions.md` (guidelines)

---

## ✅ Success Criteria

- ✅ 6+ components built with variants
- ✅ All components use colors/typography from Assets (no hardcoding)
- ✅ 3-5 interactive prototypes created
- ✅ 6 documentation pages with guidelines
- ✅ Design tokens exported for developers
- ✅ Component library published
- ✅ File shared with team
- ✅ Ready for developer handoff

---

## 🚀 Execute Phase 3 Now

**Run this task with:**
1. Verify design system → Report success
2. Create Button component → Report variants
3. Create 4 more components → Report count
4. Build prototypes → Report interactions
5. Create documentation → Report pages
6. Publish and share → Report links

**Expected output:** Detailed progress report with all steps completed

---

**File:** mhmydzsUHbQzGanUIdHHoQ  
**Token:** Active ✅  
**Status:** Ready for Phase 3 execution
