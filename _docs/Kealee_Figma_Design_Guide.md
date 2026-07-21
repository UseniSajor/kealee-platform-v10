# KEALEE PLATFORM v10
# FIGMA DESIGN GUIDE
## UI/UX Design Specifications Only

---

# OVERVIEW

This document covers **UI/UX design only** using Figma. It does NOT include:
- Backend development
- Database design
- API implementation
- Business logic
- Server infrastructure

**Figma's Role:** Create visual designs, components, and prototypes that developers will implement in code.

---

# 1. FIGMA FILE STRUCTURE

## Team Library Organization

```
📁 KEALEE PLATFORM v10 (Figma Team)
│
├── 📄 🎨 Design System
│   ├── Cover Page
│   ├── 🎨 Colors
│   │   ├── Primary Palette
│   │   ├── Secondary Palette  
│   │   ├── Semantic Colors
│   │   ├── Surface Colors
│   │   └── Dark Mode Variants
│   ├── 📝 Typography
│   │   ├── Font Families
│   │   ├── Type Scale
│   │   └── Text Styles
│   ├── 📐 Spacing & Layout
│   │   ├── Spacing Scale (4px base)
│   │   ├── Grid System
│   │   └── Breakpoints
│   ├── 🔲 Effects
│   │   ├── Shadows
│   │   ├── Border Radius
│   │   └── Blur Effects
│   └── 📋 Design Tokens
│       └── Exportable JSON
│
├── 📄 🧩 Component Library
│   ├── Cover Page
│   ├── 🔘 Buttons
│   ├── 📝 Form Elements
│   ├── 🗂️ Cards
│   ├── 📊 Data Display
│   ├── 🧭 Navigation
│   ├── 💬 Feedback
│   ├── 📈 Charts
│   ├── 🏗️ Construction-Specific
│   └── 🤖 AI Components
│
├── 📄 🖥️ os-admin Screens
│   ├── Dashboard
│   ├── User Management
│   ├── Project Overview
│   ├── Subscriptions
│   ├── Command Center
│   └── Settings
│
├── 📄 📋 os-pm Screens
│   ├── Dashboard
│   ├── Projects
│   ├── Bids (APP-01)
│   ├── Visits (APP-02)
│   ├── Change Orders (APP-03)
│   ├── Reports (APP-04)
│   ├── Permits (APP-05)
│   ├── Inspections (APP-06)
│   ├── Budget (APP-07)
│   ├── Tasks (APP-09)
│   ├── Documents (APP-10)
│   ├── AI Dashboard (APP-11-14)
│   └── Settings
│
├── 📄 🛒 m-marketplace Screens
│   ├── Homepage
│   ├── Service Categories
│   ├── Vendor Profile
│   ├── Lead Marketplace
│   ├── Post Project Flow
│   ├── Pricing
│   ├── Design Hub
│   ├── Auth (Sign In/Up)
│   └── Vendor Dashboard
│
├── 📄 📱 Mobile Designs
│   ├── os-pm Mobile
│   └── Marketplace Mobile
│
└── 📄 🎯 Prototypes
    ├── Onboarding Flow
    ├── Bid-to-Contract Flow
    ├── Daily PM Workflow
    └── Marketplace Conversion
```

---

# 2. DESIGN TOKENS

## 2.1 Color System

### Primary Colors (Kealee Blue)
```
Name                 Hex        Usage
──────────────────────────────────────────────────
primary-50          #EFF6FF    Subtle backgrounds
primary-100         #DBEAFE    Hover states
primary-200         #BFDBFE    Active states
primary-300         #93C5FD    Borders
primary-400         #60A5FA    Icons
primary-500         #3B82F6    Links, secondary buttons
primary-600         #2563EB    Primary hover
primary-700         #1D4ED8    Primary active
primary-800         #1E40AF    Primary default ★
primary-900         #1E3A8A    Text on light
```

### Secondary Colors (Construction Orange)
```
Name                 Hex        Usage
──────────────────────────────────────────────────
secondary-50        #FFF7ED    Subtle backgrounds
secondary-100       #FFEDD5    Hover states
secondary-200       #FED7AA    Active states
secondary-300       #FDBA74    Borders
secondary-400       #FB923C    Icons
secondary-500       #F97316    CTA default ★
secondary-600       #EA580C    CTA hover
secondary-700       #C2410C    CTA active
secondary-800       #9A3412    Text
secondary-900       #7C2D12    Dark text
```

### Semantic Colors
```
Name                 Hex        Usage
──────────────────────────────────────────────────
success             #10B981    Success states, completed
success-light       #34D399    Success hover
warning             #F59E0B    Warning states, pending
warning-light       #FBBF24    Warning hover
error               #EF4444    Error states, failed
error-light         #F87171    Error hover
info                #3B82F6    Info states, links
info-light          #60A5FA    Info hover
```

### Neutral Colors
```
Name                 Hex        Usage
──────────────────────────────────────────────────
gray-900            #111827    Primary text
gray-800            #1F2937    Secondary text
gray-700            #374151    Tertiary text
gray-600            #4B5563    Placeholder text
gray-500            #6B7280    Disabled text
gray-400            #9CA3AF    Icons
gray-300            #D1D5DB    Borders
gray-200            #E5E7EB    Dividers
gray-100            #F3F4F6    Backgrounds
gray-50             #F9FAFB    Subtle backgrounds
white               #FFFFFF    Surface
```

### Dark Mode Colors
```
Name                 Hex        Usage
──────────────────────────────────────────────────
dark-bg             #0F172A    Background
dark-surface        #1E293B    Card backgrounds
dark-border         #334155    Borders
dark-text           #F1F5F9    Primary text
dark-text-muted     #94A3B8    Secondary text
```

## 2.2 Typography

### Font Families
```
Display:  Plus Jakarta Sans (Google Fonts)
Body:     Inter (Google Fonts)
Mono:     JetBrains Mono (Google Fonts)
```

### Type Scale
```
Name          Size     Line Height   Weight      Usage
─────────────────────────────────────────────────────────────────
hero          64px     1.1           700         Hero headlines
h1            48px     1.2           700         Page titles
h2            36px     1.25          600         Section titles
h3            30px     1.3           600         Card titles
h4            24px     1.35          600         Subsections
h5            20px     1.4           600         Small headers
body-lg       18px     1.6           400         Lead paragraphs
body          16px     1.5           400         Body text
body-sm       14px     1.5           400         Secondary text
caption       12px     1.4           400         Captions, labels
```

## 2.3 Spacing Scale

```
Token         Value      Pixels    Usage
──────────────────────────────────────────────────
space-0       0          0px       Reset
space-1       0.25rem    4px       Tight spacing
space-2       0.5rem     8px       Icon gaps
space-3       0.75rem    12px      Small padding
space-4       1rem       16px      Standard padding
space-5       1.25rem    20px      Medium padding
space-6       1.5rem     24px      Card padding
space-8       2rem       32px      Section gaps
space-10      2.5rem     40px      Large gaps
space-12      3rem       48px      Section padding
space-16      4rem       64px      Page sections
space-20      5rem       80px      Hero sections
space-24      6rem       96px      Large sections
```

## 2.4 Border Radius

```
Token         Value      Usage
──────────────────────────────────────────────────
radius-none   0          Sharp corners
radius-sm     4px        Small elements
radius-md     6px        Inputs, buttons
radius-lg     8px        Cards, modals
radius-xl     12px       Large cards
radius-2xl    16px       Hero sections
radius-full   9999px     Pills, avatars
```

## 2.5 Shadows

```
Token         Value                                    Usage
──────────────────────────────────────────────────────────────────
shadow-sm     0 1px 2px rgba(0,0,0,0.05)              Subtle lift
shadow-md     0 4px 6px -1px rgba(0,0,0,0.1)          Cards
shadow-lg     0 10px 15px -3px rgba(0,0,0,0.1)        Dropdowns
shadow-xl     0 20px 25px -5px rgba(0,0,0,0.1)        Modals
shadow-2xl    0 25px 50px -12px rgba(0,0,0,0.25)      Overlays
```

---

# 3. COMPONENT SPECIFICATIONS

## 3.1 Buttons

### Button Variants
```
┌─────────────────────────────────────────────────────────────────┐
│  PRIMARY BUTTON                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Background: gradient(secondary-500 → secondary-400)            │
│  Text: white, font-semibold                                     │
│  Padding: 12px 24px                                             │
│  Border Radius: 8px                                             │
│  Shadow: shadow-sm                                              │
│                                                                 │
│  States:                                                        │
│  • Default: as above                                            │
│  • Hover: scale(1.02), shadow-md, darker gradient              │
│  • Active: scale(0.98), shadow-sm                              │
│  • Disabled: opacity 50%, no cursor                            │
│  • Loading: spinner icon, text "Loading..."                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SECONDARY BUTTON                                               │
├─────────────────────────────────────────────────────────────────┤
│  Background: transparent                                        │
│  Border: 2px solid primary-600                                  │
│  Text: primary-600, font-semibold                              │
│  Padding: 12px 24px                                             │
│  Border Radius: 8px                                             │
│                                                                 │
│  States:                                                        │
│  • Hover: bg primary-50, border primary-700                    │
│  • Active: bg primary-100                                      │
│  • Disabled: opacity 50%                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  GHOST BUTTON                                                   │
├─────────────────────────────────────────────────────────────────┤
│  Background: transparent                                        │
│  Text: gray-600, font-medium                                   │
│  Padding: 8px 16px                                              │
│                                                                 │
│  States:                                                        │
│  • Hover: bg gray-100, text gray-900                           │
│  • Active: bg gray-200                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Button Sizes
```
Size      Height    Padding      Font Size
──────────────────────────────────────────
sm        32px      8px 16px     14px
md        40px      12px 24px    16px
lg        48px      16px 32px    18px
xl        56px      20px 40px    20px
```

## 3.2 Form Elements

### Input Field
```
┌─────────────────────────────────────────────────────────────────┐
│  INPUT FIELD ANATOMY                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Label (body-sm, gray-700, font-medium)                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [Icon]  Placeholder text                              [✓] │ │
│  └───────────────────────────────────────────────────────────┘ │
│  Helper text (caption, gray-500)                               │
│                                                                 │
│  Specs:                                                         │
│  • Height: 44px                                                 │
│  • Padding: 12px 16px                                          │
│  • Border: 1px solid gray-300                                  │
│  • Border Radius: 8px                                          │
│  • Background: white                                           │
│                                                                 │
│  States:                                                        │
│  • Focus: border primary-500, ring 2px primary-100            │
│  • Error: border error, text error                             │
│  • Disabled: bg gray-50, opacity 60%                          │
│  • Filled: border gray-400                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Select Dropdown
```
┌─────────────────────────────────────────────────────────────────┐
│  SELECT DROPDOWN                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Same as Input, plus:                                          │
│  • Chevron icon (right side)                                   │
│  • Dropdown panel: white bg, shadow-lg, radius-lg             │
│  • Option: padding 12px 16px, hover bg gray-50                │
│  • Selected option: bg primary-50, text primary-700           │
│  • Max height: 300px with scroll                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Checkbox & Radio
```
┌─────────────────────────────────────────────────────────────────┐
│  CHECKBOX                          RADIO                        │
├─────────────────────────────────────────────────────────────────┤
│  Size: 20px × 20px                 Size: 20px × 20px            │
│  Border: 2px gray-300              Border: 2px gray-300         │
│  Radius: 4px                       Radius: full (circle)        │
│                                                                 │
│  Checked:                          Selected:                    │
│  • bg primary-600                  • border primary-600         │
│  • white checkmark icon            • inner dot primary-600      │
│                                    • dot size: 10px             │
│                                                                 │
│  Focus: ring 2px primary-100       Focus: ring 2px primary-100  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 3.3 Cards

### Base Card
```
┌─────────────────────────────────────────────────────────────────┐
│  CARD ANATOMY                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  [Header Area - optional]                                 │ │
│  │  ───────────────────────────────────────────────────────  │ │
│  │                                                           │ │
│  │  [Content Area]                                           │ │
│  │                                                           │ │
│  │  ───────────────────────────────────────────────────────  │ │
│  │  [Footer Area - optional]                                 │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Specs:                                                         │
│  • Background: white                                           │
│  • Border: 1px solid gray-200                                  │
│  • Border Radius: 12px                                         │
│  • Shadow: shadow-sm                                           │
│  • Padding: 24px                                               │
│                                                                 │
│  Hover (if interactive):                                       │
│  • Shadow: shadow-md                                           │
│  • Border: gray-300                                            │
│  • Transform: translateY(-2px)                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 3.4 Navigation

### Sidebar
```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR NAVIGATION                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Width: 240px (expanded), 64px (collapsed)                     │
│  Background: white                                             │
│  Border Right: 1px solid gray-200                              │
│                                                                 │
│  Logo Area:                                                     │
│  • Height: 64px                                                │
│  • Padding: 16px                                               │
│                                                                 │
│  Nav Item:                                                      │
│  • Height: 44px                                                │
│  • Padding: 12px 16px                                          │
│  • Icon: 20px, gray-500                                        │
│  • Text: body-sm, gray-700                                     │
│  • Border Radius: 8px                                          │
│  • Margin: 4px 8px                                             │
│                                                                 │
│  Nav Item States:                                              │
│  • Hover: bg gray-50                                           │
│  • Active: bg primary-50, text primary-700, icon primary-600  │
│  • With badge: badge on right, primary bg                      │
│                                                                 │
│  Section Divider:                                              │
│  • Label: caption, gray-400, uppercase                         │
│  • Line: 1px gray-200                                          │
│  • Margin: 24px 0 8px                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Top Navigation Bar
```
┌─────────────────────────────────────────────────────────────────┐
│  TOP NAV BAR                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Height: 64px                                                  │
│  Background: white / blur(12px) with 80% opacity               │
│  Border Bottom: 1px solid gray-200                             │
│  Position: sticky top                                          │
│  Z-index: 50                                                   │
│                                                                 │
│  Layout:                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Logo]     [Nav Links]        [Search] [Notif] [Avatar] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Nav Link:                                                      │
│  • Text: body-sm, gray-600                                     │
│  • Hover: text gray-900                                        │
│  • Active: text primary-600, underline 2px                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 4. CONSTRUCTION-SPECIFIC COMPONENTS

## 4.1 Bid Comparison Card

```
┌─────────────────────────────────────────────────────────────────┐
│  BID COMPARISON CARD                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ┌──────┐                                                  │ │
│  │ │ LOGO │  Contractor Name              ⭐ 4.9 (127)       │ │
│  │ │ 48px │  📍 Location · Distance                          │ │
│  │ └──────┘                                                  │ │
│  │                                                           │ │
│  │ ┌──────────────────────────────────────────────────────┐ │ │
│  │ │  BID AMOUNT      TIMELINE       SCORE                │ │ │
│  │ │  $18,500         21 days        92/100               │ │ │
│  │ │  ████████░░      ██████████░    ████████████████░░   │ │ │
│  │ │  vs $18.2K avg   vs 25 day avg  AI Recommended ⭐     │ │ │
│  │ └──────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │ STRENGTHS                    CONSIDERATIONS              │ │
│  │ ✓ Fastest completion         ⚠ Slightly higher price    │ │
│  │ ✓ Highest rated              ⚠ Limited warranty         │ │
│  │                                                           │ │
│  │ [View Profile]                    [Award Contract ▶]     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Component Structure:                                          │
│  • Card container: white, radius-xl, shadow-md                │
│  • Header: flex row, align center                             │
│  • Metrics grid: 3 columns, gray-50 bg                        │
│  • Progress bars: primary color for good, warning for avg     │
│  • Strengths: success color with checkmark                    │
│  • Considerations: warning color with triangle                │
│  • CTA: primary button (Award) + ghost (View)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 4.2 Permit Status Tracker

```
┌─────────────────────────────────────────────────────────────────┐
│  PERMIT STATUS TRACKER                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BUILDING PERMIT #BP-2026-0142                                 │
│  DC DCRA · Kitchen Renovation                                  │
│                                                                 │
│  Progress Steps:                                               │
│  ●━━━━━━━●━━━━━━━◐━━━━━━━○━━━━━━━○                            │
│  Submitted  Review   Plan Check  Approved  Issued              │
│  Jan 15     Jan 18   In Progress                               │
│                                                                 │
│  Step States:                                                  │
│  • Complete (●): success color, filled circle                  │
│  • Current (◐): primary color, half-filled                    │
│  • Pending (○): gray-300, empty circle                        │
│  • Line: 4px height, color matches state                      │
│                                                                 │
│  Status Box:                                                   │
│  • Background: primary-50                                      │
│  • Border: 1px primary-200                                     │
│  • Border Radius: 8px                                          │
│  • Icon: info icon, primary-600                               │
│                                                                 │
│  Actions: ghost buttons (View, Contact, Track)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 4.3 Visit Schedule Card

```
┌─────────────────────────────────────────────────────────────────┐
│  VISIT SCHEDULE CARD                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layout:                                                        │
│  ┌──────────┬────────────────────────────────────────────────┐ │
│  │ TIME     │  Project Name                                  │ │
│  │ BLOCK    │  📍 Address                                    │ │
│  │          │  🌤️ Weather                                    │ │
│  │  9:00    │                                                │ │
│  │   AM     │  CHECKLIST          ROUTE MAP                  │ │
│  │          │  □ Item 1           ┌──────────┐              │ │
│  │ ░░░░░░░  │  □ Item 2           │  [MAP]   │              │ │
│  │ ░░░░░░░  │  □ Item 3           │  15 min  │              │ │
│  └──────────┴───────────────────  └──────────┘──────────────┘ │
│                                                                 │
│  Time Block:                                                   │
│  • Width: 80px                                                 │
│  • Background: primary-50                                      │
│  • Time: h3, primary-800                                       │
│  • AM/PM: caption, primary-600                                 │
│  • Progress stripes: animated diagonal                         │
│                                                                 │
│  Checklist:                                                    │
│  • Checkbox: 18px, interactive                                 │
│  • Label: body-sm                                              │
│                                                                 │
│  Map Preview:                                                  │
│  • Size: 120px × 80px                                          │
│  • Border Radius: 8px                                          │
│  • Route line overlay                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 4.4 AI Prediction Card

```
┌─────────────────────────────────────────────────────────────────┐
│  AI PREDICTION CARD                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Header:                                                        │
│  • Alert icon + "DELAY RISK DETECTED"                          │
│  • Badge: "HIGH (87%)" in error color                          │
│  • Background: error-50 for high, warning-50 for medium       │
│                                                                 │
│  Confidence Bar:                                               │
│  • Height: 8px                                                 │
│  • Background: gray-200                                        │
│  • Fill: gradient based on severity                            │
│  • Percentage label on right                                   │
│                                                                 │
│  Root Causes:                                                  │
│  • Numbered list                                               │
│  • Each item: icon + description + percentage                 │
│  • Icon color based on impact level                           │
│                                                                 │
│  Recommendations:                                              │
│  • Arrow icon (→) in primary color                            │
│  • Text: body-sm                                               │
│  • Background: gray-50 on hover (interactive)                 │
│                                                                 │
│  Actions:                                                       │
│  • [View Full Analysis] - ghost button                        │
│  • [Take Action] - primary button                             │
│  • [Dismiss] - text link                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 4.5 Budget Meter

```
┌─────────────────────────────────────────────────────────────────┐
│  BUDGET METER                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Header: "PROJECT BUDGET"                                      │
│                                                                 │
│  Main Display:                                                 │
│  $127,450 / $150,000                              85%          │
│                                                                 │
│  Progress Bar:                                                 │
│  ████████████████████████████████████████████████░░░░░░░░     │
│  │         Labor         │ Materials │Permits│ Remaining │     │
│                                                                 │
│  Progress Bar Specs:                                           │
│  • Height: 24px                                                │
│  • Border Radius: 12px                                         │
│  • Segments: Different colors per category                    │
│    - Labor: primary-600                                        │
│    - Materials: primary-400                                    │
│    - Permits: primary-200                                      │
│    - Remaining: gray-200                                       │
│                                                                 │
│  Category Labels:                                              │
│  • Position: below bar, aligned with segments                 │
│  • Font: caption, gray-600                                    │
│                                                                 │
│  Stat Cards (3 column grid):                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │ Change Ords │ │ Contingency │ │  Variance   │              │
│  │   +$8,200   │ │   $12,000   │ │   -$2,450   │              │
│  │   (5.5%)    │ │    (8%)     │ │  Under ✓    │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                 │
│  Stat Card Specs:                                              │
│  • Background: gray-50                                         │
│  • Border Radius: 8px                                          │
│  • Label: caption, gray-500                                    │
│  • Value: h4, gray-900                                         │
│  • Sublabel: caption, success/warning/error based on status  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 5. PAGE LAYOUTS

## 5.1 Grid System

```
Desktop (1280px+):    12 columns, 24px gutter, 80px margin
Laptop (1024px):      12 columns, 20px gutter, 48px margin
Tablet (768px):       8 columns, 16px gutter, 32px margin
Mobile (< 768px):     4 columns, 16px gutter, 16px margin
```

## 5.2 Common Layouts

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar 240px]  │  [Content Area]                              │
│                  │                                              │
│ Logo             │  [Top Nav Bar 64px]                         │
│                  │  ─────────────────────────────────────────  │
│ Navigation       │                                              │
│ • Dashboard      │  [Page Content]                              │
│ • Projects       │                                              │
│ • Bids           │  Welcome, Tim                                │
│ • Visits         │                                              │
│ • ...            │  [Stats Row - 4 cards]                      │
│                  │                                              │
│                  │  [Main Content Grid]                        │
│                  │  ┌─────────────┐ ┌─────────────┐            │
│                  │  │ Left Panel  │ │ Right Panel │            │
│                  │  │ (2/3 width) │ │ (1/3 width) │            │
│                  │  └─────────────┘ └─────────────┘            │
│                  │                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Marketing Layout (Marketplace)
```
┌─────────────────────────────────────────────────────────────────┐
│ [Full Width Top Nav - sticky]                                   │
│ Logo    Nav Links                    [Sign In] [Get Started]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Hero Section - Full Width, gradient bg]                       │
│                                                                 │
│ [Content Sections - max-width 1280px, centered]                │
│                                                                 │
│ [Footer - Full Width, dark bg]                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 6. RESPONSIVE BREAKPOINTS

## Breakpoint Values
```
Mobile:         0 - 639px      (sm)
Tablet:         640 - 1023px   (md)
Desktop:        1024 - 1279px  (lg)
Large Desktop:  1280px+        (xl)
```

## Component Adaptations

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Sidebar | Hidden (hamburger) | Collapsed (icons) | Full |
| Cards | 1 column | 2 columns | 3-4 columns |
| Tables | Card view | Horizontal scroll | Full |
| Forms | Stacked | Stacked | 2 columns |
| Modals | Full screen | Centered (480px) | Centered (640px) |

---

# 7. DESIGN TOKEN EXPORT

## Export Format (Style Dictionary)

```json
{
  "color": {
    "primary": {
      "800": { "value": "#1E40AF" }
    },
    "secondary": {
      "500": { "value": "#F97316" }
    }
  },
  "typography": {
    "fontFamily": {
      "display": { "value": "Plus Jakarta Sans" }
    },
    "fontSize": {
      "h1": { "value": "48px" }
    }
  },
  "spacing": {
    "4": { "value": "16px" }
  }
}
```

## Figma Plugin Setup

1. Install **Figma Tokens** plugin
2. Create token structure matching above
3. Link to GitHub repository
4. Auto-sync on changes

---

# 8. HANDOFF CHECKLIST

## For Each Screen Design

- [ ] All states designed (default, hover, active, disabled, loading, error)
- [ ] Responsive variants (mobile, tablet, desktop)
- [ ] Dark mode variant (if applicable)
- [ ] Component instances linked to library
- [ ] Design tokens applied (no hardcoded values)
- [ ] Spacing consistent with scale
- [ ] Typography using text styles
- [ ] Colors from color styles only
- [ ] Prototype interactions added
- [ ] Developer notes in comments
- [ ] Accessibility checked (contrast, focus states)

---

**Document Version:** 1.0  
**Created:** January 26, 2026  
**Scope:** UI/UX Design Only  

---

*This document is proprietary to Kealee Construction LLC.*
