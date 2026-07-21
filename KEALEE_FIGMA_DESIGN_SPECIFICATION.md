# KEALEE PLATFORM - FIGMA DESIGN SPECIFICATION

**Version:** 2.0  
**Date:** May 31, 2026  
**Platform:** Kealee Platform v10/v20  
**Status:** Ready for Figma Implementation

---

## 📋 TABLE OF CONTENTS

1. [Design System Overview](#design-system-overview)
2. [Color Palette](#color-palette)
3. [Typography System](#typography-system)
4. [Spacing & Layout Grid](#spacing--layout-grid)
5. [Elevation & Shadows](#elevation--shadows)
6. [Border Radius & Corners](#border-radius--corners)
7. [Motion & Animation](#motion--animation)
8. [Component Specifications](#component-specifications)
9. [Module Themes](#module-themes)
10. [Accessibility Standards](#accessibility-standards)

---

## 🎯 DESIGN SYSTEM OVERVIEW

### Brand Identity
- **Platform:** Kealee - Construction Development Lifecycle Platform
- **Design Philosophy:** Clean, professional, construction-industry focused
- **Primary Framework:** Tailwind CSS + React
- **Component Library:** @kealee/ui (23+ component categories)
- **Deployment:** 23 production applications across 8 user roles

### Core Design Principles
1. **Trust & Professionalism** - Blue primary color palette
2. **Energy & Construction** - Orange secondary for accents
3. **Clarity** - Clear hierarchy and information architecture
4. **Efficiency** - Fast, scannable interfaces
5. **Accessibility** - WCAG 2.1 AA compliance minimum

---

## 🎨 COLOR PALETTE

### PRIMARY COLORS

#### Blue - Trust & Professionalism
Used for primary CTAs, links, and core UI elements.

| Shade | Hex Code | Usage |
|-------|----------|-------|
| 50 | #eff6ff | Subtle backgrounds |
| 100 | #dbeafe | Light backgrounds |
| 200 | #bfdbfe | Hover states (light) |
| 300 | #93c5fd | Borders (light) |
| 400 | #60a5fa | Interactive elements |
| **500** | **#3B82F6** | **Primary Brand Color** |
| **600** | **#2563EB** | **Buttons & Links** |
| **700** | **#1D4ED8** | **Hover States** |
| 800 | #1e40af | Pressed states |
| 900 | #1e3a8a | Maximum contrast |

**Figma Setup:**
```
Create color style: "Primary/Blue-500" = #3B82F6
Create color styles for all shades: Primary/Blue-50 through Primary/Blue-900
```

---

#### Orange - Energy & Construction
Used for accents, highlights, and secondary CTAs.

| Shade | Hex Code | Usage |
|-------|----------|-------|
| 50 | #fff7ed | Subtle highlights |
| 100 | #ffedd5 | Light accents |
| 200 | #fed7aa | Hover accents |
| 300 | #fdba74 | Borders |
| 400 | #fb923c | Interactive |
| **500** | **#F97316** | **Secondary Accent** |
| 600 | #ea580c | Hover accent |
| 700 | #c2410c | Pressed accent |

**Figma Setup:**
```
Create color style: "Secondary/Orange-500" = #F97316
Create color styles for all shades: Secondary/Orange-50 through Secondary/Orange-700
```

---

### SEMANTIC COLORS

#### Success - Completed, Approved
| Color | Hex Code | Component |
|-------|----------|-----------|
| Base | #10B981 | Status badges, checkmarks |
| Light | #D1FAE5 | Success backgrounds |

#### Warning - Attention Needed
| Color | Hex Code | Component |
|-------|----------|-----------|
| Base | #F59E0B | Warning badges, alerts |
| Light | #FEF3C7 | Warning backgrounds |

#### Error - Mistakes, Blocks
| Color | Hex Code | Component |
|-------|----------|-----------|
| Base | #EF4444 | Error badges, destructive actions |
| Light | #FEE2E2 | Error backgrounds |

#### Information
| Color | Hex Code | Component |
|-------|----------|-----------|
| Base | #3B82F6 | Info badges, alerts |
| Light | #EFF6FF | Info backgrounds |

**Figma Setup:**
```
Create semantic color group:
  Semantic/Success = #10B981
  Semantic/Warning = #F59E0B
  Semantic/Error = #EF4444
  Semantic/Info = #3B82F6
```

---

### NEUTRAL COLORS - Grayscale

| Shade | Hex Code | Usage |
|-------|----------|-------|
| 50 | #f9fafb | Subtle backgrounds, page backgrounds |
| 100 | #f3f4f6 | Card backgrounds, panels |
| 200 | #e5e7eb | **Borders (default)** |
| 300 | #d1d5db | Borders (hover) |
| 400 | #9ca3af | Placeholders, disabled text |
| 500 | #6b7280 | Secondary text, helper text |
| 600 | #4b5563 | Body text |
| 700 | #374151 | Headings, strong text |
| 800 | #1f2937 | Dark headings, captions |
| 900 | #111827 | Maximum contrast, primary text on white |

**Figma Setup:**
```
Create grayscale group:
  Neutral/Gray-50 through Neutral/Gray-900
Use Gray-200 as default border color
Use Gray-50 as default background
Use Gray-900 as default text color
```

---

## ✍️ TYPOGRAPHY SYSTEM

### Font Families

#### Primary Font: Inter
- **Usage:** Body text, UI labels, buttons
- **Styles Available:** Regular (400), Medium (500), Semibold (600), Bold (700)
- **Fallback Stack:** `Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`
- **License:** Open Source (SIL)

#### Secondary Font: Plus Jakarta Sans (Headings)
- **Usage:** Page titles, section headings (alternative)
- **License:** Open Source (SIL)

#### Monospace Font: JetBrains Mono
- **Usage:** Code, data values, technical text
- **License:** OFL 1.1

**Figma Setup:**
```
Add font libraries:
  1. Inter (Google Fonts)
  2. Plus Jakarta Sans (Google Fonts)
  3. JetBrains Mono (Google Fonts)
```

---

### Typography Scale

#### Display/Hero (Page Level)
| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|------------|---|---|
| Hero 6XL | 60px | Bold (700) | 72px (1.2x) | -0.02em | Landing page hero |
| Hero 5XL | 48px | Bold (700) | 60px (1.25x) | -0.02em | Page titles, hero sections |

#### Heading Level
| Name | Size | Weight | Line Height | Usage |
|------|------|--------|------------|---|
| Heading 4XL | 36px | Bold (700) | 44px (1.22x) | Page main heading |
| Heading 3XL | 30px | Bold (700) | 36px (1.2x) | Section heading |
| Heading 2XL | 24px | Semibold (600) | 30px (1.25x) | Card heading, subsection |
| Heading XL | 20px | Semibold (600) | 28px (1.4x) | Heading level 4 |

#### Body Text
| Name | Size | Weight | Line Height | Usage |
|------|------|--------|------------|---|
| Body LG | 18px | Normal (400) | 28px (1.56x) | Emphasized body text |
| Body Base | 16px | Normal (400) | 24px (1.5x) | **Default body text** |
| Body SM | 14px | Normal (400) | 20px (1.43x) | Secondary text, labels |
| Body XS | 12px | Normal (400) | 16px (1.33x) | Small labels, captions |

#### Label & Button
| Name | Size | Weight | Line Height | Usage |
|------|------|--------|------------|---|
| Label LG | 16px | Medium (500) | 24px (1.5x) | Button text |
| Label Base | 14px | Medium (500) | 20px (1.43x) | Form labels, badges |
| Label SM | 12px | Medium (500) | 16px (1.33x) | Small badges, tags |

**Figma Setup:**
```
Create text styles for each scale above:
  Display/Hero-6XL
  Display/Hero-5XL
  Heading/4XL through Heading/XL
  Body/LG, Body/Base, Body/SM, Body/XS
  Label/LG, Label/Base, Label/SM
  
Apply from component definitions automatically
```

---

## 📐 SPACING & LAYOUT GRID

### Spacing Scale (4px Base Unit)

| Step | Size | Pixels | Usage |
|------|------|--------|-------|
| 0 | 0 | 0px | No spacing |
| 1 | 0.25rem | 4px | Minimal spacing |
| 2 | 0.5rem | 8px | Tight spacing (icon+text) |
| 3 | 0.75rem | 12px | Compact spacing |
| **4** | **1rem** | **16px** | **Default base unit** |
| 5 | 1.25rem | 20px | Comfortable spacing |
| 6 | 1.5rem | 24px | Section spacing |
| 8 | 2rem | 32px | Large spacing |
| 10 | 2.5rem | 40px | Between sections |
| 12 | 3rem | 48px | Major sections |
| 16 | 4rem | 64px | Page sections |
| 20 | 5rem | 80px | Large gaps |
| 24 | 6rem | 96px | Maximum spacing |

**Figma Setup:**
```
Enable 4px grid:
  - View → Show Layout Grid
  - Grid: 4px (uniform)
  
Create spacing variables:
  Spacing/0 = 0px
  Spacing/1 = 4px
  ... through Spacing/24 = 96px
```

---

### Layout Grid

#### Desktop Grid (1024px+)
- **Columns:** 12 columns
- **Column Width:** 64px
- **Gutter:** 24px
- **Margin:** 40px (left/right)
- **Total Width:** 1280px

```
[40px margin] [12 × (64px col + 24px gutter)] [40px margin]
Total: 1280px
```

#### Tablet Grid (768px - 1023px)
- **Columns:** 8 columns
- **Column Width:** 64px
- **Gutter:** 16px
- **Margin:** 24px
- **Total Width:** 768px

#### Mobile Grid (320px - 767px)
- **Columns:** 4 columns
- **Gutter:** 12px
- **Margin:** 16px
- **Total Width:** 375px (average)

**Figma Setup:**
```
Create separate frames for each breakpoint:
  Frame: "Desktop 1280"  (1280px wide)
  Frame: "Tablet 768"    (768px wide)
  Frame: "Mobile 375"    (375px wide)
  
Assign layout grids to each frame with specs above
```

---

## 📦 ELEVATION & SHADOWS

### Shadow Elevation System

Shadows create depth and hierarchy. Use these exact values:

| Level | Shadow Values | Usage |
|-------|--------------|-------|
| **None** | none | Flat elements, disabled |
| **SM** | 0 1px 2px 0 rgba(0,0,0,0.05) | Subtle depth (borders > shadows) |
| **MD** | 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1) | **Default card shadow** |
| **LG** | 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1) | Elevated cards, dropdowns |
| **XL** | 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1) | Modals, popovers |
| **2XL** | 0 25px 50px -12px rgba(0,0,0,0.25) | Full-screen overlays |
| **Inner** | inset 0 2px 4px 0 rgba(0,0,0,0.05) | Inner shadows (focus states) |

**Figma Setup:**
```
Create shadow variables:
  Shadow/None
  Shadow/SM
  Shadow/MD (default for cards)
  Shadow/LG
  Shadow/XL
  Shadow/2XL
  Shadow/Inner
```

---

## 🔵 BORDER RADIUS & CORNERS

### Radius Scale

| Name | Value | Usage |
|------|-------|-------|
| None | 0px | Sharp corners |
| SM | 2px | Subtle rounding |
| **Base** | **6px** | **Default cards & components** |
| MD | 8px | Buttons |
| LG | 12px | Modals, large cards |
| XL | 16px | Extra-large containers |
| 2XL | 24px | Hero sections, oversized elements |
| Full | 9999px | Circles, pills |

**Component-Specific Radii:**

| Component | Radius |
|-----------|--------|
| Button | 8px (MD) |
| Input Field | 6px (Base) |
| Card | 6px (Base) |
| Modal | 12px (LG) |
| Badge | 4px (between SM & Base) |
| Avatar | Full (circle) |
| Tooltip | 6px (Base) |

**Figma Setup:**
```
Create corner radius variables:
  BorderRadius/None = 0px
  BorderRadius/SM = 2px
  BorderRadius/Base = 6px
  BorderRadius/MD = 8px
  BorderRadius/LG = 12px
  BorderRadius/XL = 16px
  BorderRadius/2XL = 24px
  BorderRadius/Full = 9999px
```

---

## 🎬 MOTION & ANIMATION

### Timing

| Duration | Value | Usage |
|----------|-------|-------|
| **Fast** | **150ms** | **Micro-interactions (hover, focus)** |
| **Normal** | **200ms** | **Standard transitions** |
| **Slow** | **300ms** | **Page transitions, complex animations** |
| **Slower** | **500ms** | **Large layout shifts, entrance effects** |

### Easing Curves

| Easing | Cubic Bezier | Usage |
|--------|------------|-------|
| **Linear** | `linear` | Loaders, continuous motion |
| **In** | `cubic-bezier(0.4, 0, 1, 1)` | Accelerating (scale down, fade out) |
| **Out** | `cubic-bezier(0, 0, 0.2, 1)` | Decelerating (scale up, fade in) |
| **InOut** | `cubic-bezier(0.4, 0, 0.2, 1)` | Natural motion (combined animations) |

### Animation Guidelines

#### Hover States
```
Duration: 150ms
Easing: ease-out
Scale: 102% for buttons
Opacity: -10% for text
```

#### Focus States
```
Duration: 200ms
Easing: ease-out
Outline: 3px solid primary-300
Outline Offset: 2px
```

#### Page Transitions
```
Duration: 300ms
Easing: ease-in-out
Fade: 0 → 1 (for incoming content)
```

#### Loading States
```
Duration: 800ms (spin)
Easing: linear
Rotation: 360° continuous
```

**Figma Setup:**
```
Create animation presets:
  Animation/Hover-Fast (150ms, ease-out)
  Animation/Transition-Normal (200ms, ease-in-out)
  Animation/Loading-Spin (800ms, linear)
```

---

## 🧩 COMPONENT SPECIFICATIONS

### Buttons

#### Primary Button
- **Background:** Blue-600 (#2563EB)
- **Text:** White, Label/LG (16px, Medium)
- **Padding:** 12px 24px (vertical 12px, horizontal 24px)
- **Border Radius:** 8px (MD)
- **Height:** 44px (standard)

**States:**
- Default: Blue-600
- Hover: Blue-700
- Active/Pressed: Blue-800
- Disabled: Gray-400, 50% opacity
- Focus: Blue-300 outline (3px), 2px offset

#### Secondary Button
- **Background:** Gray-100
- **Border:** 1px Gray-300
- **Text:** Gray-700, Label/LG
- **Padding:** 12px 24px
- **Border Radius:** 8px

#### Tertiary Button
- **Background:** Transparent
- **Text:** Blue-600, Label/LG
- **Padding:** 12px 24px
- **Hover:** Blue-50 background

#### Icon Button
- **Size:** 40px × 40px
- **Icon Size:** 24px
- **Border Radius:** 6px
- **Padding:** 8px (center icon)

---

### Form Inputs

#### Text Input
- **Height:** 44px
- **Padding:** 12px 16px
- **Border Radius:** 6px (Base)
- **Border:** 1px Gray-300
- **Font:** Body/Base (16px)
- **Placeholder:** Gray-500

**States:**
- Default: Gray-300 border, Gray-50 bg
- Hover: Gray-400 border
- Focus: Blue-500 border, shadow-inner
- Error: Red border, red-50 bg
- Disabled: Gray-100 bg, Gray-400 text

#### Text Area
- **Min Height:** 120px
- **Padding:** 12px 16px
- **Resize:** Vertical only
- **Same border rules as Text Input**

#### Select Dropdown
- **Height:** 44px
- **Padding:** 12px 16px
- **Border Radius:** 6px
- **Chevron Icon:** Right side, Gray-600

#### Checkbox
- **Size:** 20px × 20px
- **Border Radius:** 4px
- **Border:** 2px Blue-600
- **Checked:** Blue-600 fill + white checkmark
- **Label:** Body/Base, Gray-700

#### Radio Button
- **Size:** 20px × 20px
- **Border Radius:** Full (circle)
- **Outer border:** 2px Gray-400
- **Selected:** 8px inner circle Blue-600

---

### Cards

#### Default Card
- **Background:** White
- **Border Radius:** 6px (Base)
- **Padding:** 24px
- **Border:** 1px Gray-200
- **Shadow:** MD
- **Hover:** Shadow-LG

#### Project Card
- **Width:** 300px (fixed)
- **Padding:** 16px
- **Image Height:** 180px (16:9 aspect)
- **Border Radius:** 6px
- **Content Sections:** Image, title (Heading-2XL), description, footer

---

### Modal/Dialog

#### Modal Container
- **Width:** 90vw (max 600px on desktop, 90% on mobile)
- **Border Radius:** 12px (LG)
- **Padding:** 32px
- **Shadow:** 2XL
- **Backdrop:** Black, 50% opacity (Gray-900)
- **Z-Index:** 1050

#### Modal Header
- **Padding Bottom:** 24px
- **Border Bottom:** 1px Gray-200
- **Title:** Heading-3XL, Gray-900
- **Close Button:** Right corner, 24px icon

#### Modal Footer
- **Padding Top:** 24px
- **Border Top:** 1px Gray-200
- **Button Layout:** Right-aligned, primary + secondary

---

### Data Display Components

#### Data Table
- **Header Background:** Gray-50
- **Header Text:** Label/SM, Gray-700, Bold
- **Row Height:** 52px
- **Border:** 1px Gray-200 between rows
- **Hover Row:** Gray-50 background
- **Cell Padding:** 16px (horizontal)

#### Badge
- **Padding:** 4px 12px
- **Border Radius:** 4px
- **Font:** Label/SM, Medium
- **Default:** Gray bg + Gray text
- **Success:** Green-50 bg + Green-700 text
- **Warning:** Yellow-50 bg + Yellow-700 text
- **Error:** Red-50 bg + Red-700 text

#### Progress Bar
- **Height:** 8px
- **Border Radius:** Full (pill shape)
- **Background:** Gray-200
- **Filled:** Blue-600
- **Label:** Body/SM above

#### Stepper / Progress Indicator
- **Step Circle:** 40px diameter
- **Completed:** Blue-600 bg + white checkmark
- **Active:** Blue-600 border, number inside
- **Upcoming:** Gray-300 border, Gray-500 text
- **Connector Line:** 2px Gray-300 (between steps)

---

## 🎭 MODULE THEMES

Each application gets a unique color accent while maintaining Blue-600 primary:

### Theme Matrix

| Module | Primary | Accent | Use Case |
|--------|---------|--------|----------|
| **m-marketplace** | Blue-600 | Orange-500 | Contractor marketplace |
| **m-project-owner** | Blue-600 | Green-600 | Project owner portal |
| **m-ops-services** | Blue-600 | Orange-500 | Operations/contractors |
| **m-architect** | Indigo-600 | Orange-500 | Architecture professionals |
| **m-engineer** | Cyan-600 | Orange-500 | Engineering services |
| **m-permits-inspections** | Violet-600 | Green-600 | Permits/inspections |
| **m-finance-trust** | Blue-600 | Blue-600 | Finance/escrow |
| **m-inspector** | Cyan-600 | Green-600 | Inspector dashboard |
| **os-pm** | Blue-600 | Orange-500 | Project management |
| **os-admin** | Gray-900 | Orange-500 | Admin dark theme |

### CSS Variables (Root Level)

```css
:root {
  --theme-primary: #2563eb;      /* Blue-600 */
  --theme-accent: #f97316;       /* Orange-500 */
  --theme-primary-50: #eff6ff;
  --theme-primary-100: #dbeafe;
  --theme-primary-200: #bfdbfe;
  --theme-primary-300: #93c5fd;
  --theme-primary-400: #60a5fa;
  --theme-primary-500: #3b82f6;
  --theme-primary-600: #2563eb;
  --theme-primary-700: #1d4ed8;
  --theme-primary-800: #1e40af;
  --theme-primary-900: #1e3a8a;
  --theme-accent-50: #fff7ed;
  --theme-accent-100: #ffedd5;
  --theme-accent-200: #fed7aa;
  --theme-accent-300: #fdba74;
  --theme-accent-400: #fb923c;
  --theme-accent-500: #f97316;
  --theme-accent-600: #ea580c;
}
```

---

## ♿ ACCESSIBILITY STANDARDS

### Color Contrast Requirements

All text must meet WCAG AA standards minimum:
- **Normal text:** 4.5:1 contrast ratio (minimum)
- **Large text (18px+):** 3:1 contrast ratio (minimum)
- **UI components/borders:** 3:1 contrast ratio

**Approved Text Colors:**
- On Gray-50: Use Gray-900 or Gray-800
- On White: Use Gray-900 or Gray-800
- On Gray-100: Use Gray-900 or Gray-800
- On Blue-600: Use White only
- On Blue-500: Use White or Gray-900

### Focus States

- **Outline:** 3px solid Blue-300 (or current theme primary-300)
- **Offset:** 2px from element
- **Applies to:** All interactive elements (buttons, inputs, links)
- **Never remove:** focus-visible outlines

### Interactive Elements

- **Minimum size:** 44px × 44px touch target
- **Button text:** Never use color alone to convey meaning
- **Links:** Underline or distinct styling (not color-only)
- **Form labels:** Always associated with inputs (not placeholder-only)
- **Error messages:** Associated with error-causing input, descriptive text

### Dark Mode Considerations

Currently not implemented, but preparation:
- Gray-900 for dark backgrounds
- Gray-50 for light text on dark
- Orange-500 maintains contrast on dark
- Blue-400 for dark mode primary (instead of Blue-600)

---

## 📊 FIGMA FILE STRUCTURE RECOMMENDATION

```
Kealee-Platform-Design-System
├── 📄 Cover Page
├── 📑 Documentation Pages
│   ├── Colors
│   ├── Typography
│   ├── Spacing & Grid
│   ├── Elevation & Shadows
│   ├── Border Radius
│   ├── Motion
│   └── Accessibility
├── 🧩 Components
│   ├── Buttons (Primary, Secondary, Tertiary, Icon)
│   ├── Forms (Input, Textarea, Select, Checkbox, Radio)
│   ├── Cards (Default, Project, Estimate, Bid)
│   ├── Modals & Dialogs
│   ├── Data Display (Table, Badge, Progress)
│   ├── Navigation (TopNav, Sidebar, Breadcrumbs)
│   ├── Feedback (Toast, Loading, Empty State)
│   └── Specialized (Timeline, Kanban, BeforeAfter)
├── 🎭 Module Themes
│   ├── m-architect Theme
│   ├── m-marketplace Theme
│   ├── m-project-owner Theme
│   ├── os-admin Theme (Dark)
│   └── [Other module themes]
├── 📱 Responsive Breakpoints
│   ├── Desktop 1280px
│   ├── Tablet 768px
│   └── Mobile 375px
└── 🎨 Variations & States
    ├── Button States
    ├── Input States
    ├── Card States
    └── Theme Color Combinations
```

---

## 🚀 NEXT STEPS FOR FIGMA

1. **Create Master File**
   - Set up design tokens as Figma variables (colors, spacing, typography)
   - Create color styles for all color palettes
   - Create text styles for all typography scales

2. **Build Component Library**
   - Create main components for each UI element
   - Set component properties for variants
   - Link to design tokens

3. **Create System Documentation**
   - Add documentation pages explaining each system
   - Include usage guidelines for each component
   - Add examples and do's/don'ts

4. **Module Theme File**
   - Create separate Figma files for each major module
   - Apply theme overrides to components
   - Show how accent colors change UI

5. **Prototype Key Flows**
   - Login/authentication flow
   - Project creation flow
   - Bid/estimation flow
   - Approval workflow

---

## 📝 FIGMA IMPORT CHECKLIST

- [ ] All colors created as variables or styles
- [ ] Typography styles applied to all text
- [ ] Spacing variables set up (0-24 scale)
- [ ] Shadow variables created
- [ ] Border radius variables set up
- [ ] Breakpoint frames created
- [ ] Component library built
- [ ] Module themes documented
- [ ] Accessibility notes added to components
- [ ] Prototypes connected
- [ ] Share link generated
- [ ] Design handoff prepared

---

## 📞 DESIGN SYSTEM REPOSITORY

**Location:** `packages/ui/`

**Key Files:**
- `src/design-tokens.ts` - Canonical token definitions
- `src/tokens.ts` - Extended tokens
- `tailwind.config.ts` - Tailwind configuration
- `src/themes.ts` - Module theme definitions
- `src/components/` - React component library

**Documentation:**
- `docs/DESIGN_SYSTEM_PACKAGE.md` - Detailed system docs
- `docs/UX_UI_MASTER_SPECIFICATION.md` - UX specifications

---

**Document Version:** 2.0  
**Last Updated:** May 31, 2026  
**Status:** ✅ Ready for Figma Implementation

For questions or updates, reference the source files in `packages/ui/` and `docs/` directories.
