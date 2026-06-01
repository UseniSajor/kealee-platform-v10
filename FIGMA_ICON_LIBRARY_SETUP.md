# 🎨 FIGMA DESIGN SYSTEM - ICON LIBRARY SETUP

**Modern, High-Quality Icons for Kealee Platform**  
**Status:** Ready for Implementation  
**Icons Framework:** Lucide React + Figma Icon Library

---

## 🎯 RECOMMENDED ICON SOURCES

### PRIMARY: Lucide React (Already in Platform)
- **Status:** 562+ icons available in codebase
- **Quality:** Consistent 24px grid, 2px stroke
- **License:** ISC (Open Source)
- **URL:** https://lucide.dev

**Installation in Figma:**
```
1. Go to Figma Community Assets
2. Search "Lucide Icons"
3. Add "Lucide Icons - Official"
4. Subscribe to updates
```

### SECONDARY: Feather Icons (Premium Complement)
- **Quality:** Clean, minimal design
- **License:** MIT
- **URL:** https://feathericons.com

### TERTIARY: Heroicons by Tailwind Labs
- **Quality:** Professional, solid & outline variants
- **License:** MIT
- **URL:** https://heroicons.com

---

## 📦 ICON CATEGORIES FOR KEALEE PLATFORM

### Navigation & UI (15+ icons)
```
Home, Settings, Menu, X, ChevronDown, ChevronUp, ArrowRight, ArrowLeft,
Search, Filter, More, Sidebar, Bell, User, LogOut, Menu, Grid, List
```

### Construction Domain (25+ icons)
```
Building, Construction, Ruler, SquareRuler, Hammer, Wrench, Drill,
Saw, Crane, Excavator, TrendingUp, PieChart, BarChart3, Floor,
Window, Door, Roof, Brick, Concrete, Steel, Blueprint, 3D, Layout
```

### Status & Feedback (12+ icons)
```
CheckCircle, AlertCircle, AlertTriangle, Info, X, Clock,
Download, Upload, Refresh, Send, Archive, Trash2
```

### Communication (8+ icons)
```
MessageCircle, MessageSquare, Phone, Mail, Share2, Copy, Link, Maximize2
```

### Data & Documents (10+ icons)
```
FileText, Download, Upload, Share, Folder, FolderOpen, File, Image,
Paperclip, Calendar
```

### Finance & Transactions (8+ icons)
```
DollarSign, CreditCard, Wallet, TrendingUp, PieChart, BarChart3, Eye, EyeOff
```

### Actions (12+ icons)
```
Edit, Plus, Minus, Copy, Delete, Share, Flag, Star, Heart, Check, X, Maximize
```

---

## 🛠️ HOW TO SET UP IN FIGMA

### Step 1: Add Icon Library to File
```
1. Open your Figma file
2. Go to Assets panel → Libraries
3. Click "Search community files"
4. Search: "Lucide Icons"
5. Click "Subscribe"
6. Icons now available in Assets panel
```

### Step 2: Import Specific Icon Categories
Create a dedicated "Icons" page with sections:

**Page Structure:**
```
Icons/
├── Navigation (15 icons grid)
├── Construction (25 icons grid)
├── Status & Feedback (12 icons grid)
├── Communication (8 icons grid)
├── Documents (10 icons grid)
├── Finance (8 icons grid)
└── Actions (12 icons grid)
```

### Step 3: Create Icon Components
For each icon in your system:

```
1. Duplicate from Lucide library
2. Name: "Icon/{Category}/{IconName}"
3. Set default size: 24px × 24px
4. Create size variants: 16, 20, 24, 32px
5. Create color variants: Primary, Secondary, Neutral, Error
6. Set as main component
7. Save to library
```

**Example Component Naming:**
```
Icon/Navigation/Menu
├── Size=16
├── Size=20
├── Size=24 (default)
├── Size=32
Icon/Navigation/Menu (with color override)
├── Color=Primary
├── Color=Neutral
├── Color=Error
```

---

## 🎨 ICON STYLING IN FIGMA

### Base Icon Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Default Size** | 24px × 24px | Fits standard UI density |
| **Stroke Weight** | 2px | Consistent with Lucide style |
| **Color** | Use CSS Variables | Inherit from design tokens |
| **Corner Radius** | None | Sharp corners (icons) |
| **Padding** | 4px (internal) | For touch targets |

### Icon Size Scale

| Name | Size | Use Case |
|------|------|----------|
| **XS** | 16px | Small labels, badges |
| **SM** | 20px | Secondary icons |
| **Base** | 24px | **Default UI icons** |
| **LG** | 32px | Large buttons, headers |
| **XL** | 48px | Hero sections, large CTAs |

### Color Variants

**Create 4 color override variants:**
```
Color/Primary   → #2563eb (primary color)
Color/Secondary → #f97316 (accent color)
Color/Neutral   → #6b7280 (secondary text)
Color/Error     → #ef4444 (destructive actions)
```

---

## 🔧 FIGMA BEST PRACTICES FOR ICONS

### 1. Naming Convention
```
Icon/{Category}/{Name}/{Size}/{Color}

Examples:
  Icon/Navigation/Menu/24/Primary
  Icon/Construction/Building/32/Neutral
  Icon/Status/CheckCircle/20/Success
```

### 2. Organization Strategy
```
Create nested component structure:
  ├── Icon/Navigation (group)
  │   ├── Menu
  │   ├── Settings
  │   ├── User
  │   └── Search
  ├── Icon/Construction (group)
  │   ├── Building
  │   ├── Blueprint
  │   └── Ruler
  └── Icon/Status (group)
      ├── CheckCircle
      ├── AlertCircle
      └── InfoCircle
```

### 3. Main Components
```
For each icon:
1. Create a main component
2. Add size property (16, 20, 24, 32)
3. Add color property (Primary, Secondary, Neutral, Error)
4. Set grid constraint to fixed size
5. Lock layer from editing
6. Add description/documentation
```

### 4. Using Icons in Components
```
Example: Button Primary component
  ├── Icon component (main/icon/24/primary) - left
  ├── Text component (label/lg) - center
  └── Optional: Icon component (right)
```

---

## 🌐 INTEGRATION POINTS

### Where Icons Appear in Platform

| Location | Size | Color | Quantity |
|----------|------|-------|----------|
| **Navigation Sidebar** | 24px | Primary/Neutral | 15+ |
| **Buttons** | 24px | Inherit text | 50+ |
| **Form Fields** | 20px | Secondary/Error | 30+ |
| **Data Tables** | 20px | Primary/Neutral | 20+ |
| **Status Badges** | 16px | Semantic | 12+ |
| **Headers/Titles** | 32px | Primary | 10+ |
| **Modals/Alerts** | 48px | Semantic | 5+ |
| **Cards** | 24px | Mixed | 40+ |

**Total Icons Needed:** ~180+ (from existing Lucide set)

---

## 📥 ICON IMPORT FROM CODEBASE

### Lucide React Icons Already Integrated
```typescript
// packages/ui/package.json shows lucide-react is installed
import { Menu, Settings, User, Search, Home } from 'lucide-react';

// All 562+ icons available for import
```

### Exporting Icons to Figma
```javascript
// Export Lucide SVGs for Figma import
// Scripts location: packages/ui/scripts/

// Option 1: Import directly from Lucide Figma community library
// Option 2: Export SVGs and create components in Figma
// Option 3: Use Figma plugin to sync icons
```

---

## ✅ ICON SETUP CHECKLIST

### Phase 1: Add Icon Library
- [ ] Subscribe to Lucide Icons in Figma
- [ ] Verify icons load in Assets panel
- [ ] Create "Icons" page in file

### Phase 2: Organize Icons
- [ ] Create 7 icon category frames
- [ ] Import ~15 icons per category
- [ ] Organize in grid layout (5 columns)
- [ ] Add labels below each icon

### Phase 3: Create Components
- [ ] Create main components for each icon
- [ ] Add size properties (16, 20, 24, 32)
- [ ] Add color properties (4 colors)
- [ ] Set up component descriptions
- [ ] Test component variations

### Phase 4: Integration
- [ ] Add icons to button components
- [ ] Add icons to form components
- [ ] Add icons to navigation components
- [ ] Test in context of other components

### Phase 5: Documentation
- [ ] Create icon style guide page
- [ ] Document usage rules
- [ ] Show size & color examples
- [ ] Add interaction examples

### Phase 6: Handoff
- [ ] Generate share link
- [ ] Export icon library as SVG/PNG
- [ ] Create developer documentation
- [ ] Add to style guide

---

## 🎬 ANIMATION ICONS

Some icons can have animation states:

### Animated Icon States
```
Icon/Construction/Loader
  └── Variants:
      ├── Frame 1 (0%)
      ├── Frame 2 (25%)
      ├── Frame 3 (50%)
      ├── Frame 4 (75%)
      └── Frame 5 (100%)
      
// Figma animation: 800ms, linear, continuous rotation
```

---

## 🔗 INTEGRATION WITH DESIGN SYSTEM

### Icon + Color Variable
```css
/* Figma Variables */
Icon/Button = "Icon/Navigation/ArrowRight"
Color/Button = "Primary/Blue-600"

/* Result: Icon inherits color automatically */
```

### Icon + Typography
```
Button = Icon + Label
  ├── Icon: 24px, color: inherit
  ├── Spacing: 8px (between)
  └── Label: Label/LG (16px, Medium)
```

---

## 📚 RESOURCES

- **Lucide Icons:** https://lucide.dev (562+ icons)
- **Feather Icons:** https://feathericons.com (280+ icons)
- **Heroicons:** https://heroicons.com (292+ icons)
- **Material Design:** https://material.io/resources/icons (1000+ icons)

---

## 🚀 NEXT STEPS

1. **Subscribe to Lucide in Figma** (10 min)
2. **Organize icon categories** (30 min)
3. **Create icon components** (1 hour)
4. **Add to button/input components** (1 hour)
5. **Document usage** (30 min)
6. **Team handoff** (15 min)

**Total Time:** ~3 hours for complete icon system

---

**Version:** 1.0  
**Last Updated:** May 31, 2026  
**Status:** ✅ Ready for Implementation
