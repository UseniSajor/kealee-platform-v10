# 🎨 FIGMA MANUAL SETUP REFERENCE
## Quick Copy-Paste Values for Your Figma File

**File:** https://www.figma.com/design/mhmydzsUHbQzGanUIdHHoQ  
**Status:** Ready for manual color/typography import

---

## 📎 COLORS TO CREATE IN FIGMA

### PRIMARY BLUE (10 shades)
```
Color/Primary/50      #eff6ff
Color/Primary/100     #dbeafe
Color/Primary/200     #bfdbfe
Color/Primary/300     #93c5fd
Color/Primary/400     #60a5fa
Color/Primary/500     #3b82f6
Color/Primary/600     #2563eb  ← Main brand color
Color/Primary/700     #1d4ed8
Color/Primary/800     #1e40af
Color/Primary/900     #1e3a8a
```

### SECONDARY ORANGE (8 shades)
```
Color/Secondary/50    #fff7ed
Color/Secondary/100   #ffedd5
Color/Secondary/200   #fed7aa
Color/Secondary/300   #fdba74
Color/Secondary/400   #fb923c
Color/Secondary/500   #f97316  ← Accent color
Color/Secondary/600   #ea580c
Color/Secondary/700   #c2410c
```

### SEMANTIC COLORS (4)
```
Color/Success         #10b981  (Green)
Color/Warning         #f59e0b  (Amber)
Color/Error           #ef4444  (Red)
Color/Info            #3b82f6  (Blue)
```

### NEUTRAL GRAY (10 shades)
```
Color/Neutral/50      #f9fafb
Color/Neutral/100     #f3f4f6
Color/Neutral/200     #e5e7eb
Color/Neutral/300     #d1d5db
Color/Neutral/400     #9ca3af
Color/Neutral/500     #6b7280
Color/Neutral/600     #4b5563
Color/Neutral/700     #374151
Color/Neutral/800     #1f2937
Color/Neutral/900     #111827
```

**Total: 32 color styles**

---

## ✍️ TYPOGRAPHY TO CREATE IN FIGMA

### FONT SETUP
```
Font Family: Inter (primary)
Font Family: Plus Jakarta Sans (display)
Font Family: JetBrains Mono (code)
```

### DISPLAY STYLES (2)

| Style Name | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| Display/Hero-6XL | Plus Jakarta Sans | 60px | 700 | 1.25 |
| Display/Hero-5XL | Plus Jakarta Sans | 48px | 700 | 1.25 |

### HEADING STYLES (4)

| Style Name | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| Heading/4XL | Inter | 36px | 700 | 1.25 |
| Heading/3XL | Inter | 30px | 700 | 1.25 |
| Heading/2XL | Inter | 24px | 700 | 1.5 |
| Heading/XL | Inter | 20px | 700 | 1.5 |

### BODY STYLES (4)

| Style Name | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| Body/LG | Inter | 18px | 400 | 1.5 |
| Body/Base | Inter | 16px | 400 | 1.5 |
| Body/SM | Inter | 14px | 400 | 1.5 |
| Body/XS | Inter | 12px | 400 | 1.75 |

### LABEL STYLES (3)

| Style Name | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| Label/LG | Inter | 16px | 600 | 1.5 |
| Label/Base | Inter | 14px | 600 | 1.5 |
| Label/SM | Inter | 12px | 600 | 1.5 |

**Total: 13 text styles**

---

## 🎨 MODULE THEME COLORS

Create a page for each module with these primary + accent colors:

| Module | Primary | Primary Hex | Accent | Accent Hex |
|---|---|---|---|---|
| m-architect | Indigo | #4f46e5 | Orange | #f97316 |
| m-marketplace | Blue | #2563eb | Orange | #f97316 |
| m-project-owner | Blue | #2563eb | Green | #10b981 |
| m-engineer | Cyan | #0891b2 | Orange | #f97316 |
| m-permits-inspections | Violet | #7c3aed | Green | #10b981 |
| m-finance-trust | Blue | #2563eb | Blue | #2563eb |
| m-inspector | Cyan | #0891b2 | Green | #10b981 |
| os-pm | Blue | #2563eb | Orange | #f97316 |
| os-admin | Dark Gray | #111827 | Orange | #f97316 |

---

## 📝 STEP-BY-STEP IN FIGMA DESKTOP

### 1. Add Colors (Figma Desktop)
```
1. Left panel → Assets
2. Colors tab → "+" icon
3. Paste each color value:
   - Name: "Color/Primary/50"
   - Value: "#eff6ff"
4. Repeat 31 more times (or import from source)
```

### 2. Add Typography (Figma Desktop)
```
1. Left panel → Assets
2. Typography tab → "+" icon
3. For each text style:
   - Font: Inter (or Plus Jakarta Sans for Display)
   - Size: (from table above)
   - Weight: (from table above)
   - Line height: (from table above)
   - Name: Display/Hero-6XL (or appropriate name)
4. Repeat for all 13 styles
```

### 3. Create Component Templates
```
1. Create frame: 120x40 px
2. Add text: "Button"
3. Right-click → Create component
4. Name: "Button/Primary"
5. Repeat for other components:
   - Button/Secondary
   - Input/Text
   - Card/Default
   - Badge/Default
```

### 4. Create Module Theme Pages
```
1. Create new page: "Themes"
2. Create 9 sub-pages:
   - m-architect
   - m-marketplace
   - m-project-owner
   - m-engineer
   - m-permits-inspections
   - m-finance-trust
   - m-inspector
   - os-pm
   - os-admin
3. In each page, create color swatches showing:
   - Primary color
   - Accent color
   - Sample components in that theme
```

---

## 🚀 AUTOMATION ALTERNATIVE

If manual entry is tedious, you can use **Figma Tokens plugin**:
1. Install: Figma → Plugins → Browse plugins → Search "Figma Tokens"
2. Import: `figma-tokens.json` file
3. Apply: Click "Sync to Figma"

This imports all colors and typography automatically!

---

## ✅ VERIFICATION CHECKLIST

After setup, verify in Figma:
- [ ] 32 color styles in Assets
- [ ] 13 text styles in Assets
- [ ] All colors are correct hex values
- [ ] Typography matches specifications
- [ ] 5 component templates created
- [ ] Module theme pages organized
- [ ] No typos in style names
- [ ] All fonts are available (Inter, Plus Jakarta Sans, JetBrains Mono)

---

## 💡 TIPS

1. **Naming convention:** Use `/` for hierarchy
   - ✅ `Color/Primary/50`
   - ❌ `Primary-50`

2. **Organization:** Group similar colors
   - All Primary colors together
   - All Secondary colors together
   - All Neutral colors together

3. **Component naming:** Keep consistent
   - ✅ `Button/Primary`
   - ✅ `Input/Text`
   - ❌ `button_primary`

4. **Color naming:** Use full paths
   - ✅ `Color/Primary/600`
   - ✅ `Color/Semantic/Success`
   - ❌ `Blue-600`

---

## 📊 TIME ESTIMATE

| Task | Time |
|---|---|
| Add 32 colors (manual) | 10-15 min |
| Add 13 text styles (manual) | 5-10 min |
| Create 5 component templates | 10 min |
| Create 9 module theme pages | 15 min |
| **Total Manual Setup** | **40-50 min** |

---

## 🔗 NEXT STEPS AFTER COLORS & TYPOGRAPHY

1. **Add Icons**
   - Subscribe to Lucide Icons library
   - Create Icon components (16px, 20px, 24px, 32px)

2. **Build Full Components**
   - Button variants (5+ variations)
   - Input variants
   - Card variants
   - Form components

3. **Create Prototypes**
   - Link pages with interactions
   - Create user flows

4. **Documentation**
   - Add usage guidelines
   - Component specs
   - Accessibility notes

---

**Everything you need to get Figma populated!** 🎨

Good luck! 🚀
