# Kealee Design System Document

This document defines the Design Token values and Core Component mappings for the Kealee Platform. It serves as the Implementation Authority to ensure the Figma Dev Mode specs map directly to `packages/ui` components and Tailwind styles.

---

## 1. Design Tokens (`packages/ui/src/design-tokens.ts`)

All applications import tokens from the shared package to guarantee visual consistency. 

### Color Palette
Harmonious, executive-grade colors. Do not use generic reds, blues, or greens.

- **Slate (Neutral/Idea/Archive)**: `bg-slate-100 text-slate-700` (`#64748B`)
- **Blue (Design/Feasibility)**: `bg-blue-100 text-blue-700` (`#3182CE`)
- **Amber (Estimate/Costing)**: `bg-amber-100 text-amber-700` (`#D97706`)
- **Kealee Orange (Permit/Primary Accent)**: `bg-orange-100 text-orange-700` (`#E8793A`)
- **Purple (Contractor Match)**: `bg-violet-100 text-violet-700` (`#8B5CF6`)
- **Teal (Execution/Construction)**: `bg-teal-100 text-teal-700` (`#2ABFBF`)
- **Green (Completion/Success)**: `bg-green-100 text-green-700` (`#38A169`)

### Typography
- **Primary Font Family**: `Inter`, system-ui, sans-serif
- **Code Font Family**: `JetBrains Mono`, monospace
- **Scale**:
  - `xs`: `0.75rem` (12px) - Small labels
  - `sm`: `0.875rem` (14px) - Body/secondary text
  - `base`: `1.0rem` (16px) - Standard body
  - `lg`: `1.125rem` (18px) - Emphasized text
  - `xl`: `1.25rem` (20px) - Card headings
  - `2xl`: `1.5rem` (24px) - Section headers
  - `3xl` to `6xl`: Display headers for hero elements.

### Border Radius
- `md`: `0.5rem` (8px) - Standard buttons
- `lg`: `0.75rem` (12px) - Standard cards & forms
- `xl`: `1.0rem` (16px) - Inner elements & panels
- `2xl`: `1.5rem` (24px) - Major dashboard blocks
- `3xl`: `2.0rem` (32px) - Container panels / Glassmorphic rows

### Glassmorphism Rules (Premium Aesthetics)
To maintain the executive-grade feel, components must use:
- Transparent white or black borders: `border-slate-100` or `border-white/10`.
- Backdrop blurs: `backdrop-blur-md` or `backdrop-blur-xl`.
- Subtle shadows: `shadow-sm` or `shadow-md shadow-orange-950/5`.
- Avoid hard black outlines or heavy visual weights.

---

## 2. Figma to Code Component Registry

Figma Dev Mode components map 1:1 to React exports in `packages/ui/src/components/*`.

| Figma Component | Code Component | Location | Details |
| :--- | :--- | :--- | :--- |
| **Button** | `Button` | `components/Button.tsx` | Variants: primary, secondary, outline, ghost. Supports loading states. |
| **Card** | `Card` | `components/Card.tsx` | Standard premium layout wrapper with glassmorphic borders. |
| **Project Card** | `ProjectCard` | `components/cards/ProjectCard.tsx` | Renders project thumbnail, metrics, and progress. |
| **Status Badge** | `Badge` | `components/Badge.tsx` | Renders unified lifecycle phase badges based on token styling. |
| **Timeline** | `StepIndicator` | `components/StepIndicator.tsx` | Dynamic horizontal workflow timeline showing progress status. |
| **Permit Status** | `PermitStatus` | `components/construction/PermitStatus.tsx` | Renders permit intake details, filing state, and review statuses. |
| **Estimate Breakdown** | `EstimateBreakdown` | `components/construction/EstimateBreakdown.tsx` | Visual bill of materials, trade divisions, and estimate sums. |
| **Contractor Card** | `ContractorCard` | `components/cards/ContractorCard.tsx` | Displays contractor match score, reviews, rating, and CSI divisions. |
| **Twin Health** | `ClawStatusBar` | `components/ClawStatusBar.tsx` | Shows digital twin health scores, variance, and active tracking modules. |
| **File Uploader** | `VisitChecklist` | `components/construction/VisitChecklist.tsx` | Field checklist upload interface. |

---

## 3. Style Sheets

Global stylesheet defaults are defined in `apps/globals.css` (or `globals.css` in app workspaces). All apps configure Tailwind to import paths from `packages/ui` to compile CSS with identical class scopes.
