# 🎨 Figma Plugin Method - Step-by-Step Guide

**File ID:** mhmydzsUHbQzGanUIdHHoQ  
**Plugin Status:** ✅ Ready to Load  
**Estimated Time:** 15-30 minutes

---

## Prerequisites Check

All plugin files are ready:
- ✅ `figma-plugin-manifest.json` (0.28 KB)
- ✅ `figma-plugin-code.js` (4.36 KB)
- ✅ `figma-plugin-ui.html` (2.82 KB)
- ✅ `figma-tokens.json` (design tokens)

---

## STEP 1: Open Figma Desktop App

1. Open **Figma Desktop** (not web browser)
2. Navigate to your design file: **https://www.figma.com/file/mhmydzsUHbQzGanUIdHHoQ**
3. Make sure you're logged in

---

## STEP 2: Load the Plugin

### Option A: Load from Workspace (Recommended)

1. Click **Menu** → **Plugins** (top left in Figma)
2. Select **Development** → **New plugin**
3. A dialog appears: "What would you like to do?"
4. Choose: **"Link existing code"**
5. Navigate to workspace: `\\wsl$\Ubuntu\home\tim_chamberlain\kealee-platform-v10\`
6. Select: **`figma-plugin-manifest.json`**
7. Click **"Open"** or **"Link"**

**Result:** Plugin loads and registers as "Kealee Design System Manager"

### Option B: Manual Code Entry (Alternative)

If file selection doesn't work:
1. Click **Menu** → **Plugins** → **Development** → **New plugin**
2. Choose: **"Create new"**
3. Name: `Kealee Design System`
4. Paste contents of `figma-plugin-code.js` into the code editor
5. Paste contents of `figma-plugin-ui.html` into the UI panel
6. Save

---

## STEP 3: Run the Plugin

1. With your design file open, click **Menu** → **Plugins**
2. Find: **"Kealee Design System Manager"** (or custom name if manual)
3. Click to run

**A plugin panel appears** with UI from `figma-plugin-ui.html`

---

## STEP 4: Apply the Design System

In the plugin panel, you should see buttons/options:
- **"Apply Design System"** (main button)
- **"Apply Colors"** (if separate option)
- **"Apply Typography"** (if separate option)

Click: **"Apply Design System"** (or equivalent)

**What happens:**
- Plugin reads from `figma-tokens.json`
- Creates all 32 color styles
- Creates all 13 text styles
- Adds them to your Figma Assets panel
- Completes in 30-60 seconds

---

## STEP 5: Verify Success

1. Open **Assets** panel (right sidebar in Figma)
2. Look for tabs:
   - **Colors** → Should show all 32 styles organized by group
   - **Typography** → Should show all 13 text styles

**Expected structure:**
```
Colors/
├── Primary (10 shades)
├── Secondary (8 shades)
├── Semantic (4: Success, Warning, Error, Info)
└── Neutral (10 shades)

Typography/
├── Display (2 styles)
├── Heading (4 styles)
├── Body (4 styles)
└── Label (3 styles)
```

✅ If you see these organized in Assets → **SUCCESS!**

---

## ✨ What You Get After Plugin Runs

### Immediately Available:
- ✅ 32 color styles ready to use in design
- ✅ 13 text styles ready to apply to text layers
- ✅ Previously created components (from Phase 1) enhanced with styles

### Next Steps:
1. Create component main components with these colors/typography
2. Add component variants (sizes, states)
3. Build documentation pages
4. Export for developers

---

## 🆘 Troubleshooting

### Plugin Won't Load
- **Issue:** "File not found" error
  - **Solution:** Verify full path: `\\wsl$\Ubuntu\home\tim_chamberlain\kealee-platform-v10\figma-plugin-manifest.json`
  - **Solution:** Try Option B (manual code entry)

- **Issue:** Using Figma web browser instead of Desktop
  - **Solution:** Switch to Figma Desktop app (not web browser)

### Plugin Runs But Button Missing
- **Issue:** Plugin UI doesn't show expected buttons
  - **Solution:** Check `figma-plugin-ui.html` exists in workspace
  - **Solution:** Try running plugin again (sometimes UI needs refresh)

### Styles Not Appearing in Assets
- **Issue:** Plugin ran but no colors/typography in Assets panel
  - **Solution:** Refresh Figma (Cmd+R on Mac, Ctrl+R on Windows)
  - **Solution:** Close and reopen file
  - **Solution:** Check browser console for errors (Cmd+Option+I / Ctrl+Shift+I)

### Token Error or API Failure
- **Issue:** Plugin can't access design tokens
  - **Solution:** Verify `figma-tokens.json` exists in workspace
  - **Solution:** Check file permissions are readable
  - **Solution:** Try manual method instead

---

## 📊 Success Criteria

After plugin completes, verify:

- [ ] 32 colors in Assets panel ✓
- [ ] 13 text styles in Assets panel ✓
- [ ] No error messages in Figma console ✓
- [ ] Can select a color from Assets to apply to shape ✓
- [ ] Can select a text style and apply to text ✓
- [ ] Components from Phase 1 still visible in Assets ✓

**All checked?** → **Phase 2 Complete!** 🎉

---

## Next: Phase 3 Execution

Once plugin succeeds:

1. **Build Component Library** (1-2 hours)
   - Create main component frames
   - Add component properties and variants
   - Test component instances

2. **Create Documentation** (1-2 hours)
   - Add design system overview frame
   - Document color palette
   - Document typography scale
   - Add component usage guidelines

3. **Team Setup** (30 min)
   - Generate shareable link
   - Set up team library
   - Export tokens for developers

---

## Files You'll Need

All in: `\\wsl$\Ubuntu\home\tim_chamberlain\kealee-platform-v10\`

- **Plugin:** `figma-plugin-manifest.json`, `figma-plugin-code.js`, `figma-plugin-ui.html`
- **Tokens:** `figma-tokens.json`
- **Guides:** `PHASE_2_EXECUTION_GUIDE.md`, `FIGMA_COMPLETE_SETUP_GUIDE.md`

---

## Time Estimate

- **Plugin Loading:** 2-5 minutes
- **Plugin Execution:** 1-2 minutes
- **Verification:** 2-3 minutes
- **Total Phase 2:** 15-30 minutes

**Then Phase 3:** 2-3 hours for components + documentation

---

**Ready to load the plugin?** Follow Steps 1-5 above, then report back! 🚀

---

Generated: May 31, 2026
