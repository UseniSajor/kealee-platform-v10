export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "file"
  | "address";

export interface FieldOption {
  value: string;
  label: string;
}

export interface IntakeField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: FieldOption[];
  helperText?: string;
  step?: number;
}

export interface IntakeFormStep {
  id: string;
  title: string;
  description?: string;
  fields: IntakeField[];
}

export const EXTERIOR_CONCEPT_FORM_STEPS: IntakeFormStep[] = [
  {
    id: "contact",
    title: "Your Contact Info",
    description: "We'll use this to send your concept package.",
    fields: [
      { key: "clientName", label: "Full Name", type: "text", required: true, placeholder: "Jane Smith", step: 1 },
      { key: "contactEmail", label: "Email Address", type: "email", required: true, placeholder: "jane@example.com", step: 1 },
      { key: "contactPhone", label: "Phone Number", type: "tel", placeholder: "(555) 000-0000", step: 1 },
    ],
  },
  {
    id: "project",
    title: "About Your Project",
    description: "Tell us about the property and what you're hoping to achieve.",
    fields: [
      { key: "projectAddress", label: "Property Address", type: "address", required: true, placeholder: "123 Main St, Fort Washington, MD", step: 2 },
      {
        key: "projectType",
        label: "Project Type",
        type: "select",
        required: true,
        step: 2,
        options: [
          { value: "exterior_refresh", label: "Exterior Refresh" },
          { value: "facade_redesign", label: "Facade Redesign" },
          { value: "landscape_redesign", label: "Landscape Redesign" },
          { value: "driveway_hardscape", label: "Driveway / Hardscape Concept" },
          { value: "addition_concept", label: "Addition Concept" },
          { value: "porch_deck_concept", label: "Porch / Deck Concept" },
        ],
      },
      {
        key: "propertyUse",
        label: "Property Use",
        type: "radio",
        required: true,
        step: 2,
        options: [
          { value: "primary_residence", label: "Primary Residence" },
          { value: "investment_property", label: "Investment / Rental" },
          { value: "multifamily", label: "Multifamily (2–4 units)" },
        ],
      },
    ],
  },
  {
    id: "scope",
    title: "Scope & Budget",
    fields: [
      {
        key: "budgetRange",
        label: "Estimated Budget Range",
        type: "select",
        required: true,
        step: 3,
        options: [
          { value: "under_10k", label: "Under $10,000" },
          { value: "10k_25k", label: "$10,000 – $25,000" },
          { value: "25k_50k", label: "$25,000 – $50,000" },
          { value: "50k_100k", label: "$50,000 – $100,000" },
          { value: "100k_plus", label: "$100,000+" },
        ],
      },
      {
        key: "stylePreferences",
        label: "Style Preferences",
        type: "multiselect",
        required: true,
        step: 3,
        options: [
          { value: "modern", label: "Modern / Contemporary" },
          { value: "traditional", label: "Traditional / Classic" },
          { value: "craftsman", label: "Craftsman" },
          { value: "farmhouse", label: "Farmhouse / Rustic" },
          { value: "transitional", label: "Transitional" },
          { value: "mediterranean", label: "Mediterranean" },
          { value: "industrial", label: "Industrial / Urban" },
        ],
      },
      {
        key: "goals",
        label: "Project Goals (one per line)",
        type: "textarea",
        placeholder: "Increase curb appeal\nAdd outdoor living space\nPrepare for sale",
        step: 3,
      },
      {
        key: "knownConstraints",
        label: "Known Constraints (HOA, easements, slope, etc.)",
        type: "textarea",
        placeholder: "HOA approval required\nSteep front slope",
        step: 3,
      },
    ],
  },
  {
    id: "assets",
    title: "Upload Property Photos",
    description: "Upload at least one photo of the front of your property. Side and rear photos help us generate better concepts.",
    fields: [
      {
        key: "uploadedPhotos",
        label: "Property Photos",
        type: "file",
        required: true,
        helperText: "Accepted: JPG, PNG, HEIC, WEBP. Max 10 files.",
        step: 4,
      },
      {
        key: "timelineGoal",
        label: "Desired Project Start Timeline",
        type: "select",
        step: 4,
        options: [
          { value: "asap", label: "As soon as possible" },
          { value: "1_3_months", label: "1–3 months" },
          { value: "3_6_months", label: "3–6 months" },
          { value: "6_12_months", label: "6–12 months" },
          { value: "planning", label: "Just planning / exploring" },
        ],
      },
    ],
  },
];

// ─── Homeowner Exterior ───────────────────────────────────────────────────────
export const PACKAGE_TIERS = [
  {
    id: "essential",
    name: "Essential Concept",
    price: 299,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIAL ?? "",
    features: [
      "3 exterior concept renders",
      "Design brief summary",
      "Preliminary permit path",
      "Delivered in 3–5 business days",
    ],
    highlighted: false,
  },
  {
    id: "professional",
    name: "Professional Package",
    price: 599,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL ?? "",
    features: [
      "6 exterior concept renders",
      "2 landscape concept renders",
      "Full design brief",
      "Permit path + trade summary",
      "PM review included",
      "Delivered in 2–3 business days",
    ],
    highlighted: true,
  },
  {
    id: "premium",
    name: "Premium Package",
    price: 999,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM ?? "",
    features: [
      "8 exterior concept renders",
      "4 landscape concept renders",
      "Detailed material spec sheet",
      "Full permit path analysis",
      "PM review + revision round",
      "Priority 24-hr delivery",
    ],
    highlighted: false,
  },
] as const;

export type PackageTierId = (typeof PACKAGE_TIERS)[number]["id"];

// ─── Garden & Farming ─────────────────────────────────────────────────────────
export const GARDEN_PACKAGE_TIERS = [
  {
    id: "garden_basic",
    name: "AI Garden Concept",
    price: 395,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GARDEN_BASIC ?? "",
    features: [
      "3 garden layout options",
      "Raised bed placement plan",
      "Irrigation overview",
      "Planting guide",
      "1 revision round",
      "Delivered in 5–7 business days",
    ],
    highlighted: false,
  },
  {
    id: "garden_advanced",
    name: "Advanced Garden Design",
    price: 750,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GARDEN_ADVANCED ?? "",
    features: [
      "Detailed plant lists + spacing",
      "Drip irrigation specs",
      "3D garden views",
      "Seasonal planting calendar",
      "Up to 3 revision rounds",
      "Consultation call included",
    ],
    highlighted: true,
  },
  {
    id: "garden_full",
    name: "Full Landscape Design",
    price: 2500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GARDEN_FULL ?? "",
    features: [
      "Permit-ready landscape package",
      "Hardscape + softscape plans",
      "Full irrigation design",
      "Greenhouse / structure siting",
      "Up to 5 revision rounds",
      "PM review included",
    ],
    highlighted: false,
  },
] as const;

export type GardenPackageTierId = (typeof GARDEN_PACKAGE_TIERS)[number]["id"];

// ─── Interior Renovation ──────────────────────────────────────────────────────
export const INTERIOR_PACKAGE_TIERS = [
  {
    id: "interior_basic",
    name: "AI Interior Concept",
    price: 395,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_INTERIOR_BASIC ?? "",
    features: [
      "3 layout options",
      "Finish direction board",
      "Rough cost range",
      "1 revision round",
      "Delivered in 5–7 business days",
    ],
    highlighted: false,
  },
  {
    id: "interior_advanced",
    name: "Advanced Interior Design",
    price: 750,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_INTERIOR_ADVANCED ?? "",
    features: [
      "Detailed floor plans",
      "Material + fixture specs",
      "3D perspective views",
      "Trade coordination summary",
      "Up to 3 revision rounds",
    ],
    highlighted: true,
  },
  {
    id: "interior_full",
    name: "Full Interior Package",
    price: 2500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_INTERIOR_FULL ?? "",
    features: [
      "Permit-ready drawing set",
      "Full finish schedule",
      "Lighting + electrical layout",
      "Contractor-ready scope doc",
      "Up to 5 revision rounds",
    ],
    highlighted: false,
  },
] as const;

export type InteriorPackageTierId = (typeof INTERIOR_PACKAGE_TIERS)[number]["id"];

// ─── Whole Home ───────────────────────────────────────────────────────────────
export const WHOLE_HOME_PACKAGE_TIERS = [
  {
    id: "whole_home_basic",
    name: "AI Whole Home Concept",
    price: 585,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_WHOLE_HOME_BASIC ?? "",
    features: [
      "Floor plan direction",
      "Scope summary",
      "Material palette",
      "Rough cost range",
      "1 revision round",
    ],
    highlighted: false,
  },
  {
    id: "whole_home_advanced",
    name: "Advanced Whole Home Design",
    price: 1200,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_WHOLE_HOME_ADVANCED ?? "",
    features: [
      "3D views + floor plans",
      "Contractor-ready scope",
      "Full material schedule",
      "PM review included",
      "Up to 3 revision rounds",
    ],
    highlighted: true,
  },
  {
    id: "whole_home_full",
    name: "Full Design Package",
    price: 6500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_WHOLE_HOME_FULL ?? "",
    features: [
      "Permit-ready drawing set",
      "Structural direction",
      "Full scope + trade assignments",
      "Dedicated PM",
      "Up to 5 revision rounds",
    ],
    highlighted: false,
  },
] as const;

export type WholeHomePackageTierId = (typeof WHOLE_HOME_PACKAGE_TIERS)[number]["id"];

// ─── Developer / Feasibility ──────────────────────────────────────────────────
export const DEVELOPER_PACKAGE_TIERS = [
  {
    id: "dev_feasibility",
    name: "Full Feasibility Study",
    price: 4500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_DEV_FEASIBILITY ?? "",
    features: [
      "Pro forma + IRR analysis",
      "Scenario modeling",
      "Go / no-go recommendation",
      "Site constraints summary",
    ],
    highlighted: false,
  },
  {
    id: "dev_proforma",
    name: "Pro Forma Analysis",
    price: 2500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_DEV_PROFORMA ?? "",
    features: [
      "Unit mix modeling",
      "Cost + revenue assumptions",
      "Sensitivity analysis",
    ],
    highlighted: true,
  },
  {
    id: "dev_capital",
    name: "Capital Stack Modeling",
    price: 3500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_DEV_CAPITAL ?? "",
    features: [
      "Debt/equity structure",
      "Draw schedule",
      "Waterfall projections",
    ],
    highlighted: false,
  },
] as const;

export type DeveloperPackageTierId = (typeof DEVELOPER_PACKAGE_TIERS)[number]["id"];
