# FIGMA IMPLEMENTATION GUIDE - QUICK START

**Objective:** Build Kealee Platform design system in Figma from specification  
**Estimated Time:** 6-8 hours for complete setup  
**Difficulty:** Intermediate

---

## 🎯 PHASE 1: SETUP (1 hour)

### Step 1.1: Create Figma File
```
1. Go to figma.com
2. Create new file: "Kealee Platform Design System v2.0"
3. Enable shared fonts:
   - Inter (Google Fonts)
   - Plus Jakarta Sans (Google Fonts)
   - JetBrains Mono (Google Fonts)
4. Set page name to "Documentation"
```

### Step 1.2: Create Color Variables
```
In Figma: Assets panel → Variables → Create variable

Create these variable groups:

GROUP: Colors/Primary
  Primary-50    → #eff6ff
  Primary-100   → #dbeafe
  Primary-200   → #bfdbfe
  Primary-300   → #93c5fd
  Primary-400   → #60a5fa
  Primary-500   → #3b82f6
  Primary-600   → #2563eb
  Primary-700   → #1d4ed8
  Primary-800   → #1e40af
  Primary-900   → #1e3a8a

GROUP: Colors/Orange
  Orange-50     → #fff7ed
  Orange-100    → #ffedd5
  Orange-200    → #fed7aa
  Orange-300    → #fdba74
  Orange-400    → #fb923c
  Orange-500    → #f97316
  Orange-600    → #ea580c
  Orange-700    → #c2410c

GROUP: Colors/Semantic
  Success       → #10b981
  Warning       → #f59e0b
  Error         → #ef4444
  Info          → #3b82f6

GROUP: Colors/Neutral
  Gray-50       → #f9fafb
  Gray-100      → #f3f4f6
  Gray-200      → #e5e7eb
  Gray-300      → #d1d5db
  Gray-400      → #9ca3af
  Gray-500      → #6b7280
  Gray-600      → #4b5563
  Gray-700      → #374151
  Gray-800      → #1f2937
  Gray-900      → #111827
```

### Step 1.3: Create Spacing Variables
```
GROUP: Spacing
  Space-0       → 0px
  Space-1       → 4px
  Space-2       → 8px
  Space-3       → 12px
  Space-4       → 16px
  Space-5       → 20px
  Space-6       → 24px
  Space-8       → 32px
  Space-10      → 40px
  Space-12      → 48px
  Space-16      → 64px
  Space-20      → 80px
  Space-24      → 96px
```

### Step 1.4: Create Typography Variables
```
GROUP: FontSize
  XS            → 12px
  SM            → 14px
  Base          → 16px
  LG            → 18px
  XL            → 20px
  2XL           → 24px
  3XL           → 30px
  4XL           → 36px
  5XL           → 48px
  6XL           → 60px

GROUP: FontWeight
  Regular       → 400
  Medium        → 500
  Semibold      → 600
  Bold          → 700

GROUP: LineHeight
  Tight         → 1.25
  Normal        → 1.5
  Relaxed       → 1.75
```

---

## 🎨 PHASE 2: TEXT STYLES (1 hour)

### Step 2.1: Create Text Styles
```
1. Open Assets panel → Typography
2. Create the following text styles:

Display/Hero-6XL
  Font: Inter, Bold (700)
  Size: 60px
  Line height: 72px (1.2x)
  Letter spacing: -0.02em

Display/Hero-5XL
  Font: Inter, Bold (700)
  Size: 48px
  Line height: 60px (1.25x)
  Letter spacing: -0.02em

Heading/4XL
  Font: Inter, Bold (700)
  Size: 36px
  Line height: 44px (1.22x)

Heading/3XL
  Font: Inter, Bold (700)
  Size: 30px
  Line height: 36px (1.2x)

Heading/2XL
  Font: Inter, Semibold (600)
  Size: 24px
  Line height: 30px (1.25x)

Heading/XL
  Font: Inter, Semibold (600)
  Size: 20px
  Line height: 28px (1.4x)

Body/LG
  Font: Inter, Regular (400)
  Size: 18px
  Line height: 28px (1.56x)

Body/Base
  Font: Inter, Regular (400)
  Size: 16px
  Line height: 24px (1.5x)

Body/SM
  Font: Inter, Regular (400)
  Size: 14px
  Line height: 20px (1.43x)

Body/XS
  Font: Inter, Regular (400)
  Size: 12px
  Line height: 16px (1.33x)

Label/LG
  Font: Inter, Medium (500)
  Size: 16px
  Line height: 24px (1.5x)

Label/Base
  Font: Inter, Medium (500)
  Size: 14px
  Line height: 20px (1.43x)

Label/SM
  Font: Inter, Medium (500)
  Size: 12px
  Line height: 16px (1.33x)
```

---

## 🧩 PHASE 3: COMPONENT LIBRARY (2-3 hours)

### Step 3.1: Create Button Components
```
Page: "Components / Buttons"

Create frame: "Button Group"
├── Main components:
│   ├── Button/Primary
│   │   ├── Default
│   │   ├── Hover
│   │   ├── Active/Pressed
│   │   ├── Disabled
│   │   └── Focus
│   ├── Button/Secondary
│   ├── Button/Tertiary
│   └── Button/Icon

Dimensions: 44px height
Content: Label/LG text + padding 12px 24px
Border radius: 8px
```

### Step 3.2: Create Form Components
```
Page: "Components / Forms"

Create these main components:
├── Input/Text
│   ├── Empty
│   ├── Filled
│   ├── Focused
│   ├── Error
│   └── Disabled
├── Input/Textarea
├── Input/Select
├── Input/Checkbox
│   ├── Unchecked
│   ├── Checked
│   └── Indeterminate
└── Input/Radio
    ├── Unselected
    └── Selected

Base dimensions: 44px height
Padding: 12px 16px
Border radius: 6px
Border: 1px Gray-300
```

### Step 3.3: Create Card Components
```
Page: "Components / Cards"

Main components:
├── Card/Default
│   └── Dimensions: 300px × auto
│   └── Padding: 24px
│   └── Shadow: MD
│   └── Border radius: 6px
├── Card/Project
│   └── Image: 180px (16:9)
│   └── Content: 16px padding
└── Card/Interactive (hover state)

Create variations with states
```

### Step 3.4: Create Data Display
```
Page: "Components / DataDisplay"

Main components:
├── DataTable/Row
│   └── Height: 52px
│   └── Cell padding: 16px
├── Badge
│   ├── Success
│   ├── Warning
│   ├── Error
│   └── Default
├── ProgressBar
└── StepIndicator
    ├── Pending
    ├── Active
    ├── Completed
    └── Error
```

---

## 🎭 PHASE 4: MODULE THEMES (1-2 hours)

### Step 4.1: Create Theme Pages
```
Create new page for each major module:
├── Page: "Themes / m-architect"
│   └── Primary: Indigo-600
│   └── Accent: Orange-500
├── Page: "Themes / m-marketplace"
│   └── Primary: Blue-600
│   └── Accent: Orange-500
├── Page: "Themes / m-project-owner"
│   └── Primary: Blue-600
│   └── Accent: Green-600
├── Page: "Themes / os-admin"
│   └── Primary: Gray-900 (dark)
│   └── Accent: Orange-500
└── [Other modules...]
```

### Step 4.2: Create Theme Component Variations
```
For each theme page:
1. Duplicate button set
2. Change primary colors to module theme
3. Show sidebar navigation in theme colors
4. Show cards with theme accents
5. Demonstrate color application
```

---

## 📐 PHASE 5: RESPONSIVE BREAKPOINTS (1 hour)

### Step 5.1: Create Breakpoint Frames
```
Create new page: "Responsive Breakpoints"

Frame 1: "Desktop - 1280px"
  ├── Width: 1280px
  ├── Grid: 12 columns, 64px width, 24px gutter
  └── Margins: 40px left/right

Frame 2: "Tablet - 768px"
  ├── Width: 768px
  ├── Grid: 8 columns, 64px width, 16px gutter
  └── Margins: 24px left/right

Frame 3: "Mobile - 375px"
  ├── Width: 375px
  ├── Grid: 4 columns, 12px gutter
  └── Margins: 16px left/right

Duplicate component examples to show responsive behavior
```

---

## 📚 PHASE 6: DOCUMENTATION (1 hour)

### Step 6.1: Create Documentation Pages
```
Page: "01 - Cover"
  └── Title, version, date

Page: "02 - Color System"
  ├── Color palette with hex codes
  ├── Usage guidelines
  └── Contrast ratios

Page: "03 - Typography"
  ├── Text scale showcase
  ├── Font usage rules
  └── Weight & sizing combinations

Page: "04 - Spacing & Grid"
  ├── Spacing scale visualization
  ├── Grid layouts
  └── Padding/margin examples

Page: "05 - Components"
  ├── Component overview
  ├── Do's and Don'ts
  └── Usage guidelines

Page: "06 - Module Themes"
  ├── Theme switching
  ├── Color application
  └── Accent usage
```

---

## 🔄 PHASE 7: INTEGRATION & HANDOFF (1 hour)

### Step 7.1: Create Share Link
```
1. Figma → Share
2. Set permissions: "View only" or "Edit"
3. Generate link for development team
4. Add to documentation
```

### Step 7.2: Export Key Assets
```
Export from Figma:
├── Color palette (CSV/JSON for developers)
├── Typography specs (text styles)
├── Component sizing (dimensions)
└── Interactive prototypes (for testing)
```

### Step 7.3: Create Developer Handoff Document
```
Document in Figma:
├── Component API (properties, states)
├── Responsive behavior rules
├── Implementation notes
├── Accessibility requirements
└── Interaction specifications
```

---

## 📋 QUICK CHECKLIST

### Setup Phase
- [ ] Figma file created
- [ ] Fonts enabled (Inter, Plus Jakarta Sans, JetBrains Mono)
- [ ] Color variables created
- [ ] Spacing variables created
- [ ] Typography variables created

### Component Phase
- [ ] Button components (5 states)
- [ ] Form input components
- [ ] Card components
- [ ] Data display components
- [ ] Navigation components
- [ ] Feedback components

### Theme Phase
- [ ] m-architect theme
- [ ] m-marketplace theme
- [ ] m-project-owner theme
- [ ] m-engineer theme
- [ ] m-permits-inspections theme
- [ ] os-admin dark theme
- [ ] Other module themes

### Documentation Phase
- [ ] Color documentation page
- [ ] Typography documentation page
- [ ] Component guidelines page
- [ ] Accessibility notes page
- [ ] Responsive design page

### Finalization
- [ ] All components use variables
- [ ] Share link generated
- [ ] Assets exported
- [ ] Developer handoff ready
- [ ] Version documented

---

## 🚀 PRO TIPS

1. **Use Component Sets** - Combine variants for more flexible components
2. **Link to Specs** - Add links to design specification document in each component
3. **Create Prototypes** - Build interactive flows for user testing
4. **Version Control** - Keep dates/versions updated
5. **Regular Syncs** - Align with codebase changes (design-tokens.ts)
6. **Share Drafts** - Get feedback from development team early
7. **Document States** - Show all possible component states (hover, focus, error, etc.)
8. **Use Collections** - Organize components by category

---

## 📞 SYNC WITH CODEBASE

The Figma design system should reflect the codebase:

**Source of Truth Files:**
- `packages/ui/src/design-tokens.ts`
- `packages/ui/src/tokens.ts`
- `packages/ui/tailwind.config.ts`
- `packages/ui/src/themes.ts`

**Update Process:**
1. Changes made in code first
2. Update Figma variables to match
3. Regenerate component libraries
4. Distribute updated share link
5. Document changes in version history

---

**Ready to start?** Begin with Phase 1 (Setup) - it takes about 1 hour and will set up the foundation for the entire design system.
