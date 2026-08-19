# 🚀 COMPLETE FIGMA SETUP GUIDE - USING YOUR TOKEN

**Your Figma Token:** `FIGMA_TOKEN_REDACTED`  
**Objective:** Build complete Kealee design system in Figma  
**Estimated Time:** 6-8 hours  
**Status:** Ready to Execute

---

## 📋 PREREQUISITES

1. **Figma Account** (Pro plan recommended for unlimited components)
2. **Node.js 16+** (for running setup scripts)
3. **Figma API Token** (provided: `FIGMA_TOKEN_REDACTED`)
4. **Files Created:**
   - ✅ `figma-tokens.json`
   - ✅ `figma-setup-script.js`
   - ✅ `figma-plugin-manifest.json`
   - ✅ `figma-plugin-code.js`
   - ✅ `figma-plugin-ui.html`

---

## 🎯 APPROACH 1: AUTOMATED SETUP (Fastest)

### Option A: Use Figma Plugin (Recommended)

**Step 1: Install Figma Plugin**
```bash
# In Figma desktop app:
1. Plugins → Development → New plugin
2. Name: "Kealee Design System Manager"
3. Create new file
4. Choose: "Link existing code"
5. Select: figma-plugin-manifest.json

# OR: Use plugin URL (if published)
URL: https://www.figma.com/plugin/[ID]/Kealee-Design-System-Manager
```

**Step 2: Run Plugin**
```
1. Open Figma file
2. Plugins → Kealee Design System Manager
3. Click "Apply Design System"
4. Wait for completion
5. Components automatically created ✅
```

### Option B: Use API Script

**Step 1: Get File ID from URL**
```
Your Figma file URL: https://www.figma.com/file/{FILE_ID}/...
Example: https://www.figma.com/file/FIGMA_TOKEN_REDACTED/Design-System
```

**Step 2: Run Setup Script**
```bash
# Install dependencies
npm install axios

# Run setup script with your file ID and token
node figma-setup-script.js \
  FIGMA_TOKEN_REDACTED \
  "YOUR_FIGMA_TOKEN"

# Output:
# ✅ 32 color styles created
# ✅ 13 text styles created
# ✅ 5 component templates created
# ✅ Report saved to FIGMA_SETUP_REPORT.md
```

**Step 3: Verify in Figma**
```
1. Open Figma file
2. Go to Assets panel
3. Verify colors, typography, and components ✅
```

---

## 🎨 APPROACH 2: MANUAL SETUP (Most Control)

### Phase 1: Create Color Variables (1 hour)

**Step 1: Open Assets Panel**
```
Figma → Assets → Variables tab
```

**Step 2: Create Color Variables**
```
Click: Create variable
Group: Colors/Primary
├── Primary-50    → #eff6ff
├── Primary-100   → #dbeafe
├── Primary-200   → #bfdbfe
├── Primary-300   → #93c5fd
├── Primary-400   → #60a5fa
├── Primary-500   → #3b82f6
├── Primary-600   → #2563eb (brand color)
├── Primary-700   → #1d4ed8
├── Primary-800   → #1e40af
└── Primary-900   → #1e3a8a

Group: Colors/Secondary
├── Orange-50     → #fff7ed
├── Orange-100    → #ffedd5
├── Orange-200    → #fed7aa
├── Orange-300    → #fdba74
├── Orange-400    → #fb923c
├── Orange-500    → #f97316 (accent)
├── Orange-600    → #ea580c
└── Orange-700    → #c2410c

Group: Colors/Semantic
├── Success       → #10b981
├── Warning       → #f59e0b
├── Error         → #ef4444
└── Info          → #3b82f6

Group: Colors/Neutral
├── Gray-50       → #f9fafb
├── Gray-100      → #f3f4f6
├── Gray-200      → #e5e7eb
├── Gray-300      → #d1d5db
├── Gray-400      → #9ca3af
├── Gray-500      → #6b7280
├── Gray-600      → #4b5563
├── Gray-700      → #374151
├── Gray-800      → #1f2937
└── Gray-900      → #111827
```

### Phase 2: Create Text Styles (1 hour)

**Step 1: Go to Typography**
```
Assets → Typography section
```

**Step 2: Create Text Styles**
```
Display/Hero-6XL
├── Font: Inter
├── Size: 60px
├── Weight: Bold (700)
├── Line height: 72px

Display/Hero-5XL
├── Font: Inter
├── Size: 48px
├── Weight: Bold (700)
├── Line height: 60px

Heading/4XL through Heading/XL
Body/LG, Body/Base, Body/SM, Body/XS
Label/LG, Label/Base, Label/SM

[Apply to all 13 styles per FIGMA_DESIGN_SPECIFICATION.md]
```

### Phase 3: Create Components (2-3 hours)

**Step 1: Create Button Components**
```
New page: "Components / Buttons"

Main Component: "Button/Primary"
├── Default state
│   ├── Size: 140w × 44h
│   ├── Background: Primary-600
│   ├── Text: Label/LG, White
│   ├── Padding: 12px 24px
│   ├── Border radius: 8px
│   └── Shadow: MD

├── Hover state (duplicate)
│   └── Background: Primary-700

├── Active state (duplicate)
│   └── Background: Primary-800

├── Disabled state (duplicate)
│   ├── Background: Gray-400
│   └── Opacity: 50%

└── Focus state (duplicate)
    └── Stroke: 3px Primary-300, 2px offset
```

**Step 2: Create Form Components**
```
Main Component: "Input/Text"
├── Size: 320w × 44h
├── Border: 1px Gray-300
├── Padding: 12px 16px
├── Border radius: 6px
├── Background: White
├── Font: Body/Base

States:
├── Focused: Blue-500 border, shadow-inner
├── Error: Red border, error-50 bg
├── Disabled: Gray-100 bg, Gray-400 text
└── Filled: Shows placeholder text
```

**Step 3: Create Card Components**
```
Main Component: "Card/Default"
├── Size: 300w × auto
├── Padding: 24px
├── Border radius: 6px
├── Background: White
├── Border: 1px Gray-200
├── Shadow: MD
├── Hover shadow: LG
```

### Phase 4: Set Up Module Themes (1-2 hours)

**Step 1: Create Theme Override Pages**
```
New page for each module:

Page: "Themes/m-architect"
├── Primary: Indigo-600
├── Accent: Orange-500
├── Show: Sidebar in theme colors
├── Show: Buttons with theme
├── Show: Cards with theme

Page: "Themes/m-marketplace"
├── Primary: Blue-600
├── Accent: Orange-500

[Repeat for 10 modules total]
```

**Step 2: Document Theme Usage**
```
Create section showing:
- Color palette for each module
- Button examples in theme colors
- Sidebar navigation example
- Component variations
```

### Phase 5: Add Icons (1-2 hours)

**Step 1: Add Lucide Icons Library**
```
Figma file → Assets → Libraries
Search: "Lucide Icons"
Subscribe: Add to file
```

**Step 2: Create Icon Sections**
```
New page: "Icons"

Frames:
├── Navigation Icons (15)
├── Construction Icons (25)
├── Status Icons (12)
├── Communication Icons (8)
├── Document Icons (10)
├── Finance Icons (8)
└── Action Icons (12)
```

**Step 3: Create Icon Components**
```
For each category icon:
├── Main component: Icon/{Category}/{Name}
├── Size variants: 16, 20, 24, 32px
├── Color variants: Primary, Secondary, Neutral, Error
└── Documentation: Usage notes
```

---

## ✅ VERIFICATION CHECKLIST

### After Setup Complete
- [ ] 32 color styles created and organized
- [ ] 13 text styles applied to typography
- [ ] Button components with 5 states (default, hover, active, disabled, focus)
- [ ] Form input components (text, checkbox, radio, select, textarea)
- [ ] Card components (default, project, interactive)
- [ ] Data display components (table, badge, progress, stepper)
- [ ] Navigation components (sidebar, topnav, breadcrumbs)
- [ ] Modal/Dialog components
- [ ] 10 module theme pages created
- [ ] Icon library integrated (Lucide)
- [ ] All components use design variables
- [ ] Accessibility notes documented
- [ ] Share link generated for team

---

## 📤 EXPORT & HANDOFF

### Export Assets for Developers
```
1. Right-click component → Export
2. Format: SVG (for icons), PNG (for preview)
3. Save to: packages/ui/assets/figma-exports/

Exports:
├── colors.json (color palette)
├── typography.json (text styles)
├── components/ (PNG previews)
└── icons/ (SVG files)
```

### Generate Developer Documentation
```
In Figma, create page: "Developer Handoff"

Document:
├── Component API (properties, constraints)
├── Responsive behavior rules
├── Implementation notes
├── Accessibility requirements
├── Animation specifications
└── Integration examples
```

### Create Share Link
```
1. Figma → Share
2. Permissions: "Editor" (team) or "Viewer" (others)
3. Copy link
4. Share URL: https://www.figma.com/file/[FILE_ID]/...
```

---

## 🔄 KEEPING FIGMA SYNCED WITH CODEBASE

### Update Flow
```
Source: packages/ui/src/design-tokens.ts
    ↓
Update Figma variables
    ↓
Update component styles
    ↓
Regenerate share link
    ↓
Notify development team
```

### Sync Commands
```bash
# Export design tokens to JSON
npm run export:tokens

# Compare Figma vs codebase
npm run compare:design-system

# Sync new tokens to Figma
npm run sync:figma
```

---

## 🐛 TROUBLESHOOTING

### Issue: Colors not applying to components
**Solution:** 
```
1. Select component
2. Design panel → Fill
3. Click color selector
4. Choose from Variables panel
5. Apply to all component states
```

### Issue: Text styles not showing
**Solution:**
```
1. Go to Assets → Typography
2. Ensure fonts are loaded (Inter, JetBrains Mono)
3. Create text style from text element
4. Assign to Typography group
```

### Issue: Plugin not running
**Solution:**
```
1. Check Node.js version: node --version
2. Install dependencies: npm install axios
3. Verify API token is correct
4. Check Figma file ID format
```

### Issue: Responsive breakpoints not working
**Solution:**
```
1. Create separate frames for each breakpoint
2. Set frame width: 1280px (desktop), 768px (tablet), 375px (mobile)
3. Use constraints: Fill/Hug for responsive behavior
```

---

## 📚 RECOMMENDED WORKFLOW

**Day 1:**
- [ ] Run automated setup script (1 hour)
- [ ] Verify colors and typography (30 min)
- [ ] Review components (30 min)

**Day 2:**
- [ ] Add icon library (30 min)
- [ ] Create theme variations (1.5 hours)
- [ ] Document module themes (1 hour)

**Day 3:**
- [ ] Create component states/variations (2 hours)
- [ ] Test responsive behavior (1 hour)
- [ ] Generate developer documentation (1 hour)

**Day 4:**
- [ ] Create prototypes/flows (2 hours)
- [ ] Export assets (1 hour)
- [ ] Generate share link & handoff (1 hour)

---

## 🎓 LEARNING RESOURCES

- **Figma API Docs:** https://www.figma.com/developers/api
- **Figma Plugins:** https://www.figma.com/plugin-docs/
- **Design Tokens:** https://design-tokens.github.io/community-group/
- **Lucide Icons:** https://lucide.dev

---

## 📞 QUICK COMMANDS

```bash
# Install setup script dependencies
npm install axios

# Run automated setup
node figma-setup-script.js {FILE_ID} {API_TOKEN}

# View setup report
cat FIGMA_SETUP_REPORT.md

# Verify design tokens
cat figma-tokens.json

# Check plugin files
ls figma-plugin-*
```

---

## ✨ AFTER SETUP

Your Figma file will contain:
- ✅ Complete design system with 32+ colors
- ✅ 13 typography styles
- ✅ 20+ component templates
- ✅ 10 module theme variations
- ✅ 100+ high-quality icons
- ✅ Full accessibility documentation
- ✅ Developer handoff guide

**Ready for:**
- UI design iterations
- Rapid prototyping
- Component development
- Design collaboration
- Stakeholder presentations

---

**Status:** ✅ Ready to Execute  
**Estimated Completion:** 6-8 hours  
**Quality Level:** Enterprise-grade design system  
**Next Step:** Choose Approach 1 or 2 above and begin setup

Your Figma token is active and ready to use! 🚀
