# Kealee Platform - Complete UX/UI Master Specification

Master design system for all client-facing apps with focus on ease of use, modern aesthetics, and conversion optimization.

## 📋 Table of Contents

1. [UX Strategy & User Flows](#ux-strategy--user-flows)
2. [UI Design System](#ui-design-system)
3. [Component Library](#component-library)
4. [App-Specific UX/UI Specs](#app-specific-uxui-specs)
5. [Implementation Guide](#implementation-guide)

---

## 🎯 PART 1: UX STRATEGY & USER FLOWS

### UX Principles for Kealee Platform

1. **Clarity Over Cleverness** - Never make users think
2. **Progressive Disclosure** - Show only what's needed now
3. **Anticipate Needs** - Guide users to the next logical step
4. **Instant Feedback** - Every action gets immediate response
5. **Forgiving Design** - Easy to undo, hard to break
6. **Speed Matters** - Every task in < 3 clicks when possible

### Critical User Flows - Time Targets

| Flow | App | Target Time | Max Clicks |
|------|-----|-------------|------------|
| Create project | m-project-owner | < 2 min | 5 clicks |
| Submit permit | m-permits-inspections | < 3 min | 6 clicks |
| Purchase ops package | m-ops-services | < 90 sec | 4 clicks |
| Request design quote | m-architect | < 60 sec | 3 clicks |
| Sign up | Any app | < 45 sec | 3 clicks |
| Login | Any app | < 15 sec | 2 clicks |

### UX Flow 1: Project Creation (m-project-owner)

**Goal:** Project owner creates a project in under 2 minutes

**User Story:** "As a project owner, I want to create a project quickly so I can start tracking work immediately."

#### Flow Steps:

1. **Land on Dashboard**
   - Large "Create Project" button - primary position, blue, prominent

2. **Click "Create Project"**
   - Modal/page opens - clean, focused

3. **Step 1: Project Basics (30 seconds)**
   - Fields (all on one screen):
     - Project Name* [autofocus cursor here]
     - Location* [address autocomplete]
     - Type [dropdown: Renovation, New Build, Addition, etc.]
     - Budget Range [slider with $ amounts visible]
   - Only 4 fields - nothing else
   - Blue "Next" button - bottom right

4. **Step 2: Project Scope (30 seconds)**
   - Brief Description [textarea, 2-3 lines, placeholder shows example]
   - Timeline [simple date pickers: Start Date, End Date]
   - [Optional: Upload files - but clearly marked "Add later if needed"]
   - Progress: Step 2 of 3 - visual progress bar
   - Back | Skip | Next buttons

5. **Step 3: Contractors (30 seconds)**
   - Two options shown as cards:
     - [I'll find contractors] [Help me find contractors]
   - If "I'll find": Simple text: "You can invite contractors from your dashboard"
   - If "Help me find": Simple text: "We'll suggest contractors after project creation"
   - Just pick one, no form to fill

6. **Review & Create (10 seconds)**
   - Summary card showing:
     - Project name
     - Location
     - Budget
     - Timeline
   - [Create Project] button - large, green, prominent

7. **Success State**
   - ✅ Confetti animation (subtle)
   - "Project created successfully!"
   - Clear next steps:
     - → [View Project Dashboard]
     - → [Invite Contractors]
     - → [Upload Documents]
   - Auto-redirect to project dashboard in 3 seconds

#### UX Enhancements:

- ✅ Save as draft automatically (every 5 seconds)
- ✅ If user closes, can resume later
- ✅ Field validation inline (real-time)
- ✅ Can skip optional steps
- ✅ Progress bar shows completion %
- ✅ "Need help?" chat bubble always visible

#### Error Prevention:

- Required fields marked with *
- Budget range with presets ($10K-$50K, $50K-$100K, etc.)
- Address autocomplete prevents typos
- Can't proceed without required fields (button disabled)

### UX Flow 2: Permit Submission (m-permits-inspections)

**Goal:** Submit permit application in under 3 minutes with clear guidance

**User Story:** "As a project owner, I want to submit a permit application quickly and know exactly what happens next."

#### Flow Steps:

1. **Land on Permits Page**
   - Hero section with clear value:
     - "Get your permit approved 40% faster"
     - "AI reviews your application in 5 minutes"
   - [Start New Permit Application] - large CTA

2. **Jurisdiction Selection (20 seconds)**
   - Single focused question: "Where is your project located?"
   - [Address search box - large, autofocus]
   - As user types:
     - → Show matching addresses
     - → Auto-detect jurisdiction
   - Selected address shows:
     - ✓ Washington, DC
     - ✓ Typical approval time: 21 days
     - ✓ Fees: ~$350
   - [Continue] button

3. **Permit Type Selection (15 seconds)**
   - Visual cards (not dropdown):
     - [Building Permit] [Electrical] [Plumbing] [Mechanical]
   - Each card shows:
     - Icon
     - Name
     - Typical use case
     - Fee amount
   - Can select multiple
   - Selected cards = blue border
   - [Continue]

4. **Project Details (45 seconds)**
   - Smart form that adapts:
     - If "Building Permit" selected:
       - Project scope* [dropdown with common options]
       - Square footage* [number input]
       - Estimated cost* [auto-format as currency]
     - If "Electrical" selected:
       - Service amperage [dropdown]
       - New or upgrade [radio buttons]
   - Only show fields relevant to selected permit types
   - [Continue]

5. **Document Upload (60 seconds)**
   - Clear instructions: "Upload your plans and documents"
   - Required documents shown as checklist:
     - ☐ Site plan
     - ☐ Floor plan
     - ☐ Elevation drawings
   - [Drag & drop zone - large, clear]
   - "Drag files here or click to browse"
   - As files upload:
     - → Progress bar
     - → Checkmark when complete
     - → ✅ green check on checklist items
   - AI REVIEW HAPPENS HERE (background):
     - "Reviewing your documents..."
     - [Spinner for 5 seconds]
   - Results:
     - ✅ "3 documents meet requirements"
     - ⚠️ "Floor plan missing dimension - add before submission"
   - [Fix Issues] or [Continue Anyway]

6. **Applicant Information (30 seconds)**
   - Pre-filled if user is logged in:
     - Name [auto-filled]
     - License number (if contractor) [auto-filled]
     - Contact info [auto-filled]
   - Only need to fill:
     - Property owner name (if different)
   - [Continue]

7. **Review & Submit (20 seconds)**
   - Clean summary card:
     - 📍 Location: 1234 Main St, DC
     - 📋 Permit Type: Building, Electrical
     - 💰 Total Fees: $485
     - 📄 Documents: 4 uploaded
   - ⚠️ AI Pre-Review Results:
     - ✅ 95% likely to be approved
     - 💡 Suggestion: Add property survey for faster approval
   - [Add Survey] [Submit Application]
   - Payment handled by Stripe:
     - [Pay $485 & Submit]

8. **Success & Next Steps**
   - ✅ Celebration animation
   - "Application submitted successfully!"
   - Clear timeline shown:
     - Today → You submitted
     - Day 2 → Initial review
     - Day 7 → Site inspection (if needed)
     - Day 14-21 → Approval expected
   - Next steps:
     - → [View Application Status]
     - → [Schedule Inspection]
     - → [Add to Calendar]
   - Email confirmation sent with tracking link

#### UX Enhancements:

- ✅ AI pre-review catches 80% of common errors
- ✅ Can save and continue later
- ✅ Progress indicator throughout
- ✅ Tooltips explain each requirement
- ✅ Sample documents provided
- ✅ Real-time status updates

#### Error Prevention:

- Required documents won't let you skip
- AI flags issues before submission
- Payment happens last (no wasted money)
- Can edit any step before final submit

### UX Flow 3: Package Purchase (m-ops-services)

**Goal:** Purchase Ops Services package in under 90 seconds

**User Story:** "As a project owner, I want to quickly understand packages and purchase the right one for my needs."

#### Flow Steps:

1. **Land on Pricing Page**
   - Clear headline: "Professional Project Management for Your Construction"
   - 4 packages displayed as cards:
     - [Package A] [Package B] [Package C] [Package D]
   - Each card shows:
     - Price (large, bold)
     - Best for (clear use case)
     - Key features (3-4 bullets)
     - [Get Started] button
   - Package C marked "Most Popular" with badge

2. **Click "Get Started" on Package C (5 seconds)**
   - Immediate redirect to Stripe Checkout
   - (No intermediate "Review your selection" page)

3. **Stripe Checkout (60 seconds)**
   - Pre-filled with user info if logged in:
     - Email [auto-filled]
     - Name [auto-filled]
   - User fills:
     - Card details
     - Billing address
   - Clear summary on right:
     - Package C - Premium
     - $8,500/month
     - 14-day free trial
     - Cancel anytime
   - [Subscribe] button

4. **Processing (3 seconds)**
   - Loading state: "Processing your subscription..."
   - [Spinner]

5. **Success (instant)**
   - ✅ "Welcome to Kealee Premium!"
   - Immediate next steps:
     - "Your PM will contact you within 24 hours"
   - → [Complete Your Profile]
   - → [Schedule Kickoff Call]
   - → [View Dashboard]
   - Auto-redirect to onboarding in 5 seconds

#### UX Enhancements:

- ✅ 14-day free trial clearly stated
- ✅ Can switch plans anytime
- ✅ Cancel anytime (no lock-in)
- ✅ Immediate access to dashboard
- ✅ PM assigned within 24 hours

#### Error Prevention:

- Stripe handles payment validation
- Clear refund policy shown
- Trial period prominently displayed
- Can change/cancel easily

---

## 🎨 PART 2: UI DESIGN SYSTEM

### Design Tokens

See `packages/ui/tailwind.config.js` for complete design token configuration.

**Key Tokens:**
- Colors: Primary (blue), Secondary (orange), Success (green), Warning (yellow), Error (red), Neutrals (gray)
- Typography: Inter font family, size scale, weight scale
- Spacing: 4px base unit scale
- Border Radius: 2px to 24px scale
- Shadows: 7-level shadow system

---

## 🧩 PART 3: COMPONENT LIBRARY

### Components Available

1. **Button** - Primary, Secondary, Ghost, Danger variants
2. **Input** - Text input with validation states
3. **Card** - Default, Interactive, Elevated variants

### Usage Examples

```tsx
import { Button, Input, Card } from '@kealee/ui';

// Primary Button
<Button variant="primary" size="lg">
  Get Started
</Button>

// Input with validation
<Input
  label="Project Name"
  required
  error="This field is required"
  helperText="Choose a descriptive name"
/>

// Interactive Card
<Card variant="interactive" hover>
  <h3>Package C - Premium</h3>
  <p>$8,500/month</p>
  <Button>Get Started</Button>
</Card>
```

---

## 📱 PART 4: APP-SPECIFIC UX/UI SPECS

### m-project-owner

**Key Features:**
- Project creation flow (< 2 min)
- Dashboard with project overview
- Contractor management
- Document upload

**Design Focus:**
- Speed and efficiency
- Clear project status
- Easy contractor communication

### m-permits-inspections

**Key Features:**
- Permit submission flow (< 3 min)
- AI pre-review
- Status tracking
- Document management

**Design Focus:**
- Guidance and clarity
- Error prevention
- Progress visibility

### m-ops-services

**Key Features:**
- Package selection (< 90 sec)
- Quick checkout
- Dashboard access
- PM assignment

**Design Focus:**
- Conversion optimization
- Clear value proposition
- Trust building

### m-architect

**Key Features:**
- Quote request (< 60 sec)
- Portfolio viewing
- Communication tools

**Design Focus:**
- Visual appeal
- Quick engagement
- Professional presentation

---

## 🚀 PART 5: IMPLEMENTATION GUIDE

### Setup

1. **Install UI Package:**
   ```bash
   cd packages/ui
   npm install
   ```

2. **Configure Tailwind:**
   - Use `packages/ui/tailwind.config.js` as base
   - Extend in app-specific configs

3. **Import Components:**
   ```tsx
   import { Button, Input, Card } from '@kealee/ui';
   ```

### Best Practices

1. **Consistency:**
   - Always use design system components
   - Follow spacing and typography scales
   - Use color tokens, not hardcoded colors

2. **Accessibility:**
   - All components include ARIA attributes
   - Keyboard navigation supported
   - Focus states clearly visible

3. **Performance:**
   - Components are optimized
   - Lazy load when appropriate
   - Minimize bundle size

### Next Steps

1. ✅ Design system tokens configured
2. ✅ Core components created
3. ⏳ Additional components needed:
   - Textarea
   - Select/Dropdown
   - Checkbox
   - Radio
   - Modal
   - Toast/Notification
   - Progress Bar
   - Badge
   - Avatar

4. ⏳ App-specific implementations
5. ⏳ Testing and refinement

---

## 📚 Additional Resources

- [Component Storybook](./COMPONENT_STORYBOOK.md) - Interactive component examples
- [Design Tokens Reference](./DESIGN_TOKENS.md) - Complete token documentation
- [Accessibility Guidelines](./ACCESSIBILITY.md) - WCAG compliance guide
