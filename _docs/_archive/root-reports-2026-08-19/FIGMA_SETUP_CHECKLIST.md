# ✅ FIGMA SETUP CHECKLIST

**File:** https://www.figma.com/design/mhmydzsUHbQzGanUIdHHoQ/
**Status:** Ready for manual population

---

## 🎨 STEP 1: ADD COLORS (10 minutes)

### In Figma Desktop App:
1. Left panel → **Assets**
2. **Colors** tab → Click **+** icon
3. For each color below:
   - Click **+** to add new color style
   - Enter **Name** (e.g., "Color/Primary/50")
   - Enter **Hex value** (e.g., "#eff6ff")
   - Click **Create style**

### PRIMARY COLORS (Blue) - 10 shades

```
Color/Primary/50      #eff6ff
Color/Primary/100     #dbeafe
Color/Primary/200     #bfdbfe
Color/Primary/300     #93c5fd
Color/Primary/400     #60a5fa
Color/Primary/500     #3b82f6
Color/Primary/600     #2563eb ← Main brand
Color/Primary/700     #1d4ed8
Color/Primary/800     #1e40af
Color/Primary/900     #1e3a8a
```

### SECONDARY COLORS (Orange) - 8 shades

```
Color/Secondary/50    #fff7ed
Color/Secondary/100   #ffedd5
Color/Secondary/200   #fed7aa
Color/Secondary/300   #fdba74
Color/Secondary/400   #fb923c
Color/Secondary/500   #f97316 ← Accent
Color/Secondary/600   #ea580c
Color/Secondary/700   #c2410c
```

### SEMANTIC COLORS - 4 colors

```
Color/Success         #10b981
Color/Warning         #f59e0b
Color/Error           #ef4444
Color/Info            #3b82f6
```

### NEUTRAL COLORS (Gray) - 10 shades

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

**Total: 32 colors** ✅

---

## ✍️ STEP 2: ADD TYPOGRAPHY (5 minutes)

### In Figma Desktop App:
1. Left panel → **Assets**
2. **Typography** tab → Click **+** icon
3. For each style below:
   - Click **+** to add new text style
   - Enter **Name** (e.g., "Display/Hero-6XL")
   - Set **Font**: Inter (or Plus Jakarta Sans for Display)
   - Set **Size**: (from table below)
   - Set **Weight**: (from table below)
   - Set **Line height**: (from table below)
   - Click **Create style**

### DISPLAY STYLES

| Style Name | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| Display/Hero-6XL | Plus Jakarta Sans | 60px | 700 | 1.25 |
| Display/Hero-5XL | Plus Jakarta Sans | 48px | 700 | 1.25 |

### HEADING STYLES

| Style Name | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| Heading/4XL | Inter | 36px | 700 | 1.25 |
| Heading/3XL | Inter | 30px | 700 | 1.25 |
| Heading/2XL | Inter | 24px | 700 | 1.5 |
| Heading/XL | Inter | 20px | 700 | 1.5 |

### BODY STYLES

| Style Name | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| Body/LG | Inter | 18px | 400 | 1.5 |
| Body/Base | Inter | 16px | 400 | 1.5 |
| Body/SM | Inter | 14px | 400 | 1.5 |
| Body/XS | Inter | 12px | 400 | 1.75 |

### LABEL STYLES

| Style Name | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| Label/LG | Inter | 16px | 600 | 1.5 |
| Label/Base | Inter | 14px | 600 | 1.5 |
| Label/SM | Inter | 12px | 600 | 1.5 |

**Total: 13 text styles** ✅

---

## 🧩 STEP 3: CREATE COMPONENT TEMPLATES (10 minutes)

These are already created by the setup script, but verify:

1. Go to **Components** page in Figma
2. You should see:
   - ✅ Button/Primary
   - ✅ Button/Secondary
   - ✅ Input/Text
   - ✅ Card/Default
   - ✅ Badge/Default

If not visible, they'll be created when you sync the design system.

---

## 🎨 STEP 4: CREATE MODULE THEME PAGES (15 minutes)

Create a new page for each module:

1. Right-click on **Pages** panel → **New page**
2. Name it after the module

### Pages to Create

```
Pages:
├── Colors & Typography
├── Components
├── m-architect (Indigo + Orange)
├── m-marketplace (Blue + Orange)
├── m-project-owner (Blue + Green)
├── m-engineer (Cyan + Orange)
├── m-permits-inspections (Violet + Green)
├── m-finance-trust (Blue + Blue)
├── m-inspector (Cyan + Green)
├── os-admin (Dark Gray + Orange)
```

### For Each Module Page:
1. Create frame for module name
2. Add color swatches:
   - Primary color box
   - Accent color box
3. Add label text
4. Save frame as component

---

## ✅ VERIFICATION CHECKLIST

After manual setup, verify in Figma:

- [ ] **Colors**: 32 styles in Assets → Colors tab
- [ ] **Typography**: 13 styles in Assets → Typography tab
- [ ] **Components**: 5 templates visible
- [ ] **Pages**: 10 module pages created
- [ ] **Naming**: Follows "Category/Name" pattern
- [ ] **Organization**: Colors grouped by type
- [ ] **Fonts**: Inter, Plus Jakarta Sans available
- [ ] **No errors**: Refresh page (Cmd+Shift+R)

---

## 📝 COPY-PASTE VALUES

For fastest setup, copy these values directly:

### All 32 Colors (Copy-Paste Format)
```
Color/Primary/50 #eff6ff
Color/Primary/100 #dbeafe
Color/Primary/200 #bfdbfe
Color/Primary/300 #93c5fd
Color/Primary/400 #60a5fa
Color/Primary/500 #3b82f6
Color/Primary/600 #2563eb
Color/Primary/700 #1d4ed8
Color/Primary/800 #1e40af
Color/Primary/900 #1e3a8a
Color/Secondary/50 #fff7ed
Color/Secondary/100 #ffedd5
Color/Secondary/200 #fed7aa
Color/Secondary/300 #fdba74
Color/Secondary/400 #fb923c
Color/Secondary/500 #f97316
Color/Secondary/600 #ea580c
Color/Secondary/700 #c2410c
Color/Success #10b981
Color/Warning #f59e0b
Color/Error #ef4444
Color/Info #3b82f6
Color/Neutral/50 #f9fafb
Color/Neutral/100 #f3f4f6
Color/Neutral/200 #e5e7eb
Color/Neutral/300 #d1d5db
Color/Neutral/400 #9ca3af
Color/Neutral/500 #6b7280
Color/Neutral/600 #4b5563
Color/Neutral/700 #374151
Color/Neutral/800 #1f2937
Color/Neutral/900 #111827
```

---

## 🚀 AUTOMATION OPTION

If manual entry is tedious, use **Figma Tokens plugin**:

1. Install: Figma → Plugins → Browse → Search "Figma Tokens"
2. Import: Select `figma-tokens.json` from repo
3. Apply: Click "Sync to Figma"
4. Done! ✅

This imports all colors and typography automatically.

---

## 💡 TIPS FOR FASTER SETUP

1. **Batch entry**: Add all primary colors first, then secondary, etc.
2. **Tab through fields**: Use Tab key to move between name/value
3. **Zoom out**: Press Cmd+0 to see more at once
4. **Duplicate**: For similar styles, right-click and duplicate, then edit
5. **Sort**: Figma auto-sorts alphabetically - use "/" for hierarchy

---

## ✨ EXPECTED RESULT

After completing all steps:

✅ **32 color styles** organized in Assets
✅ **13 text styles** ready to use
✅ **5 component templates** with variants
✅ **10 module pages** showing themes
✅ **Complete design system** in Figma

Then the code side will use these tokens and sync with development.

---

**Time estimate: 30-40 minutes for full setup**

When done, reply "Figma setup complete!" and we'll sync with the code implementation.

Generated: 2026-06-01T19:09:48.824Z
