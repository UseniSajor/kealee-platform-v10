// Kealee Homepage — Message Layering Constants
// Each version serves a different psychological moment in the scroll journey

export const MESSAGES = {

  // VERSION B — Hero (top of page)
  // Purpose: Authority. Name the category. Establish infrastructure status.
  // Visitor state: Just arrived. Knows nothing yet.
  hero: {
    eyebrow: 'Est. 2002 · Nationwide · End-to-End Construction Platform',
    headline: 'The Construction Platform',
    headlineEm: 'for the Entire Project.',
    sub: 'From the first concept to the final lien waiver — one connected system for owners, builders, and every professional in between.',
    supportingLine: 'No handoffs. No gaps. No starting over.',
    primaryCta: 'Explore the Marketplace',
    secondaryCta: 'How It Works',
  },

  // VERSION C — Phase Showcase (second section)
  // Purpose: Name the pain the visitor already feels.
  //          Then immediately show the solution (5 phases).
  // Visitor state: Scrolling in, evaluating.
  phases: {
    eyebrow: 'The Platform',
    headline: 'Construction Has Always Had',
    headlineEm: 'Too Many Handoffs.',
    sub: 'Design firm → estimator → permit runner → contractor → closing attorney → next project. Every gap costs time and money.',
    subStrong: 'We eliminated them.',
    phaseConnector: 'One platform. Six phases. No gaps.',
    phases: [
      { num: '01', label: 'Design', color: 'teal' },
      { num: '02', label: 'Estimate', color: 'amber' },
      { num: '03', label: 'Permit', color: 'green' },
      { num: '04', label: 'Build', color: 'navy' },
      { num: '05', label: 'Closeout', color: 'gold' },
      { num: '06', label: 'Opportunities', color: 'purple' },
    ],
  },

  // VERSION A — Who It's For / Audience Lanes
  // Purpose: Speak to all three roles simultaneously with one universal truth.
  //          Homeowners fear being taken advantage of.
  //          GCs fear not getting paid.
  //          Professionals fear unclear scope.
  //          "Blindspots" captures all three.
  // Visitor state: Deciding which role they are.
  audiences: {
    eyebrow: "Who It's For",
    headline: 'Build Without',
    headlineEm: 'Blindspots.',
    sub: 'Every professional. Every phase. Every payment — connected in one place. Whether you\'re building your dream home, running a crew, or delivering licensed professional services, Kealee removes the gaps that cost everyone money.',
  },

  // Functional — How It Works (dark navy section)
  // Purpose: Logical, step-by-step. Shows the connected data flow.
  // Visitor state: Convinced of the why, now wants to understand the how.
  howItWorks: {
    eyebrow: 'How It Works',
    headline: 'One Platform.',
    headlineEm: 'Six Connected Phases.',
    sub: 'Your approved drawings flow from Design directly into Permit — no re-entry. Your permit approval triggers Build setup automatically. Your closeout escrow ties to verified Build milestones. And after closeout, Opportunities connects your next project with the talent and contracts to build it. Every phase feeds the next. That\'s the gap the industry never closed. Until now.',
  },

  // VERSION D — Builder Network
  // Purpose: Community and belonging. Emotional close before final CTA.
  //          The warmest, most human section of the page.
  // Visitor state: Has seen the product. Now evaluating community fit.
  network: {
    eyebrow: 'Builder Network',
    headline: 'Every Project Needs a Room Where',
    headlineEm: 'Everyone Belongs.',
    sub: 'Kealee is where homeowners, builders, and professionals meet — and where projects actually get done. The Kealee Builder Network connects verified GCs and contractors with project owners who have funded projects, approved designs, and permits in hand.',
  },

  // Knowledge Hub — 6 article cards
  knowledgeHub: {
    eyebrow: 'Knowledge Hub',
    headline: 'Know More.',
    headlineEm: 'Build Better.',
    sub: 'Construction is complex. Kealee\'s Knowledge Hub gives owners, builders, and professionals the information they need — before they spend a dollar.',
    articles: [
      {
        tag: 'Homeowner Guide',
        tagType: 'guide',
        title: 'The Complete Owner\'s Guide to the Construction Process',
        desc: 'From your first concept sketch to the final walkthrough — every decision, every phase, every professional you\'ll need. Written for people who\'ve never built before.',
        readTime: '14 min read',
        cta: 'Read Guide →',
      },
      {
        tag: 'FAQ',
        tagType: 'faq',
        title: 'What Does a General Contractor Actually Do — and How Do You Evaluate One?',
        desc: 'The GC\'s role, how markup and overhead work, what they\'re legally responsible for, and the 12 questions to ask before you sign any contract.',
        readTime: '7 min read',
        cta: 'Read Article →',
      },
      {
        tag: 'Process Guide',
        tagType: 'process',
        title: 'How the Permit Process Works — and Why Kealee Cuts It by 30%',
        desc: 'Jurisdiction requirements, plan review stages, common rejection reasons, and exactly how Kealee\'s Intelligent Permit Review and 250+ jurisdiction database changes the timeline.',
        readTime: '9 min read',
        cta: 'Read Guide →',
      },
      {
        tag: 'Glossary',
        tagType: 'glossary',
        title: 'Construction Terms Every Owner and Builder Should Know',
        desc: 'RFIs, submittals, change orders, lien waivers, substantial completion, retainage, AIA draws — defined in plain English with real project examples.',
        readTime: 'Reference',
        cta: 'View Glossary →',
      },
      {
        tag: 'Estimating Guide',
        tagType: 'guide',
        title: 'How Construction Costs Are Built — and What Drives Overruns',
        desc: 'Material costs, labor rates, overhead and profit, contingency, and how Kealee\'s Smart Takeoff platform produces line-item pricing from your drawings in hours, not weeks.',
        readTime: '8 min read',
        cta: 'Read Guide →',
      },
      {
        tag: 'FAQ',
        tagType: 'faq',
        title: 'What Is the Kealee Delivery Guarantee — and What Does It Cover?',
        desc: 'How the Kealee Service Credit works, what triggers it, what it doesn\'t cover, and why it exists. Written in plain language — no fine print spin.',
        readTime: '4 min read',
        cta: 'Read Article →',
      },
    ],
  },

  // FAQ Strip — 7 questions, all aligned with platform messaging decisions
  faq: [
    {
      q: 'How much does it cost to use Kealee?',
      a: 'Kealee\'s services are priced by phase and role — you only pay for what you use. Smart Concept drawings start at $99. Estimation services start at $195. Permits start at $495. The Owner Portal starts at $49/month during active construction. GC PM Software starts at $1,750/month. Ops Services are available à la carte from $125/month. There is no platform fee to browse, create an account, or explore the marketplace.',
    },
    {
      q: 'Do I need to use every phase?',
      a: 'No — you can start at any phase. Many homeowners come to Kealee for a single Smart Concept drawing, or only for permit services on a project already in design. Many GCs join only for PM Software or Ops Services on jobs they\'ve already won. Professionals can use the platform solely as a project pipeline and collaboration tool. Every phase is independent. Every phase also connects to the next if you want it to — that\'s where the platform earns its value.',
    },
    {
      q: 'What is the Kealee Delivery Guarantee and how does the Service Credit work?',
      a: 'The Kealee Delivery Guarantee applies to Smart Concept packages only. If Kealee fails to deliver within the stated timeframe, or if the delivered concept contains a demonstrable scope error (wrong address, wrong project type), we issue a Kealee Service Credit for the full package amount. The credit is applied to your account and redeemable on any future Kealee service — valid for 90 days. This is not a cash refund and it is not an open return window. Requests submitted because a client changed their mind, doesn\'t like the style, or found a cheaper option are not eligible — that\'s what revision rounds are for. One credit per email address and property address combination. Architecture, permit, and PM packages are not eligible — these involve hours of licensed professional labor contracted at the time of purchase.',
    },
    {
      q: 'Are the architects, engineers, and contractors on Kealee verified?',
      a: 'Yes — all of them, before they can accept a single assignment. Architects, engineers, and permit coordinators are credential-verified and license-confirmed before joining the platform. GCs and contractors in the Builder Network go through a verification process covering active license, current insurance certificates, and references — and their profile is not visible to project owners until verification is complete. Kealee does not allow unverified professionals to receive project assignments or payments through the platform.',
    },
    {
      q: 'How does escrow work for construction payments on Kealee?',
      a: 'Before construction begins, funds are deposited into a Kealee FDIC-insured escrow account. Releases are tied to verified milestone completion — the owner confirms the milestone is done, then approves the release. No payment leaves escrow without the owner\'s explicit approval. At closeout, the final payment is held until all punch list items are signed off, lien waivers are collected from all subcontractors and suppliers, and the owner gives final acceptance. GCs get paid when the work is verified complete. Owners are protected until it is.',
    },
    {
      q: 'How does the design-to-permit handoff work? Do I have to re-upload my drawings?',
      a: 'No re-upload needed. When your architectural drawings are approved on the Kealee platform, they flow automatically into the Permit phase — pre-loaded with your project address, jurisdiction, and scope. Our permit coordinators use Kealee\'s Intelligent Permit Review tools to screen the drawings against current code before filing. This direct connection between Design and Permit is one of the core reasons Kealee cuts permit timelines by up to 30% compared to managing the handoff manually.',
    },
    {
      q: 'Does Kealee serve projects outside of DC, Maryland, and Virginia?',
      a: 'Yes. Kealee is a nationwide platform. Our permit database covers 250+ jurisdictions across the country, and our Builder Network includes verified contractors in markets beyond the DC-Baltimore corridor. Smart Concept drawings and Architecture packages are delivered remotely by our licensed architects and are not limited by location. Our roots are in DC, MD, and VA — where Kealee was founded in 2002 — but the platform is built for projects anywhere in the United States.',
    },
  ],

  // COMBINED B + A — Final CTA
  // Purpose: Close with authority (B) then urgency (A).
  //          Last thing visitor sees before footer.
  // Visitor state: Ready to act, needs a final push.
  finalCta: {
    eyebrow: 'Get Started',
    headline: 'The Construction Platform',
    headlineEm: 'Built for Everyone in the Room.',
    sub: 'Start anywhere. Build without blindspots. Every professional verified, every payment protected, every phase connected — from your first concept drawing to the day you get your keys.',
  },

} as const
