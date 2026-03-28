import type { ProjectPath } from "./project-path-config";

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "address"
  | "textarea"
  | "select"
  | "multiselect"
  | "radio"
  | "boolean"
  | "numeric"
  | "file";

export interface FieldOption {
  value: string;
  label: string;
}

export interface IntakeField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: FieldOption[];
  hint?: string;
  rows?: number;
}

export interface IntakeFormStep {
  id: string;
  title: string;
  fields: IntakeField[];
}

const CONTACT_STEP: IntakeFormStep = {
  id: "contact",
  title: "Your Contact Info",
  fields: [
    { key: "clientName", label: "Full Name", type: "text", placeholder: "Jane Smith", required: true },
    { key: "contactEmail", label: "Email Address", type: "email", placeholder: "jane@example.com", required: true },
    { key: "contactPhone", label: "Phone Number", type: "tel", placeholder: "(555) 000-0000" },
    { key: "projectAddress", label: "Project Address", type: "address", placeholder: "123 Main St, City, State", required: true },
  ],
};

const SHARED_BUDGET_FIELDS: IntakeField[] = [
  {
    key: "budgetRange",
    label: "Estimated Budget",
    type: "radio",
    required: true,
    options: [
      { value: "under_50k", label: "Under $50K" },
      { value: "50k_150k", label: "$50K – $150K" },
      { value: "150k_300k", label: "$150K – $300K" },
      { value: "300k_500k", label: "$300K – $500K" },
      { value: "500k_plus", label: "$500K+" },
    ],
  },
  {
    key: "timelineGoal",
    label: "When do you want to start?",
    type: "radio",
    options: [
      { value: "asap", label: "As soon as possible" },
      { value: "1_3_months", label: "1–3 months" },
      { value: "3_6_months", label: "3–6 months" },
      { value: "6_12_months", label: "6–12 months" },
      { value: "planning", label: "Just planning ahead" },
    ],
  },
];

const ASSETS_STEP: IntakeFormStep = {
  id: "assets",
  title: "Photos & Files",
  fields: [
    {
      key: "uploadedPhotos",
      label: "Property Photos",
      type: "file",
      hint: "Upload photos of your property, existing conditions, or inspiration images.",
    },
  ],
};

export const FORM_FIELDS_BY_PATH: Record<ProjectPath, IntakeFormStep[]> = {
  garden_concept: [
    CONTACT_STEP,
    {
      id: "project",
      title: "Garden Details",
      fields: [
        {
          key: "gardenType",
          label: "Type of Garden",
          type: "multiselect",
          required: true,
          options: [
            { value: "food_garden", label: "Food / Vegetable Garden" },
            { value: "raised_beds", label: "Raised Bed System" },
            { value: "ornamental", label: "Ornamental / Flower Garden" },
            { value: "fruit_trees", label: "Fruit Trees & Orchard" },
            { value: "herb_garden", label: "Herb Garden" },
            { value: "lawn_conversion", label: "Lawn Conversion" },
            { value: "outdoor_living", label: "Outdoor Living / Patio" },
            { value: "irrigation", label: "Irrigation System" },
          ],
        },
        {
          key: "yardSize",
          label: "Approximate Yard Size",
          type: "select",
          options: [
            { value: "small_under_500", label: "Small (under 500 sq ft)" },
            { value: "medium_500_1500", label: "Medium (500–1,500 sq ft)" },
            { value: "large_1500_plus", label: "Large (1,500+ sq ft)" },
          ],
        },
        {
          key: "existingCondition",
          label: "Existing Condition",
          type: "select",
          options: [
            { value: "grass_lawn", label: "Grass lawn" },
            { value: "overgrown", label: "Overgrown / neglected" },
            { value: "partial_garden", label: "Partial garden already in place" },
            { value: "bare_soil", label: "Bare soil / recent construction" },
          ],
        },
      ],
    },
    {
      id: "scope",
      title: "Goals & Style",
      fields: [
        {
          key: "gardenGoals",
          label: "Garden Goals",
          type: "textarea",
          placeholder: "e.g. grow vegetables year-round, create a peaceful retreat, maximize yield...",
          rows: 3,
        },
        {
          key: "sustainabilityGoals",
          label: "Sustainability Priorities",
          type: "multiselect",
          options: [
            { value: "water_conservation", label: "Water Conservation" },
            { value: "composting", label: "Composting" },
            { value: "native_plants", label: "Native Plants" },
            { value: "no_pesticides", label: "No Pesticides" },
            { value: "pollinator_friendly", label: "Pollinator Friendly" },
          ],
        },
        { key: "knownConstraints", label: "Known Constraints (HOA, sun exposure, soil issues)", type: "textarea", rows: 2 },
      ],
    },
    { id: "budget", title: "Budget & Timeline", fields: SHARED_BUDGET_FIELDS },
    ASSETS_STEP,
  ],

  whole_home_concept: [
    CONTACT_STEP,
    {
      id: "project",
      title: "Home Details",
      fields: [
        { key: "squareFootage", label: "Approximate Square Footage", type: "numeric", placeholder: "2,400" },
        {
          key: "homeStyle",
          label: "Current Home Style",
          type: "select",
          options: [
            { value: "colonial", label: "Colonial" },
            { value: "craftsman", label: "Craftsman" },
            { value: "ranch", label: "Ranch" },
            { value: "split_level", label: "Split Level" },
            { value: "contemporary", label: "Contemporary" },
            { value: "tudor", label: "Tudor" },
            { value: "other", label: "Other" },
          ],
        },
        {
          key: "propertyUse",
          label: "Property Use",
          type: "select",
          options: [
            { value: "primary_residence", label: "Primary Residence" },
            { value: "rental", label: "Rental / Investment" },
            { value: "vacation_home", label: "Vacation Home" },
          ],
        },
      ],
    },
    {
      id: "scope",
      title: "Transformation Scope",
      fields: [
        {
          key: "transformationScope",
          label: "Areas to Transform",
          type: "multiselect",
          required: true,
          options: [
            { value: "exterior_facade", label: "Exterior / Facade" },
            { value: "kitchen", label: "Kitchen" },
            { value: "bathrooms", label: "Bathrooms" },
            { value: "living_areas", label: "Living Areas" },
            { value: "primary_suite", label: "Primary Suite" },
            { value: "basement", label: "Basement" },
            { value: "landscape", label: "Landscape / Outdoor" },
            { value: "addition", label: "Addition / Expansion" },
          ],
        },
        {
          key: "designStyle",
          label: "Design Style Direction",
          type: "multiselect",
          options: [
            { value: "modern", label: "Modern / Contemporary" },
            { value: "transitional", label: "Transitional" },
            { value: "traditional", label: "Traditional" },
            { value: "farmhouse", label: "Farmhouse" },
            { value: "coastal", label: "Coastal" },
            { value: "scandinavian", label: "Scandinavian" },
          ],
        },
        { key: "goals", label: "Vision & Goals", type: "textarea", placeholder: "What's the overall transformation you're envisioning?", rows: 4 },
      ],
    },
    { id: "budget", title: "Budget & Timeline", fields: SHARED_BUDGET_FIELDS },
    ASSETS_STEP,
  ],

  interior_reno_concept: [
    CONTACT_STEP,
    {
      id: "project",
      title: "Renovation Scope",
      fields: [
        {
          key: "roomScope",
          label: "Rooms to Renovate",
          type: "multiselect",
          required: true,
          options: [
            { value: "kitchen", label: "Kitchen" },
            { value: "primary_bath", label: "Primary Bathroom" },
            { value: "secondary_bath", label: "Secondary Bathroom" },
            { value: "living_room", label: "Living Room" },
            { value: "dining_room", label: "Dining Room" },
            { value: "bedroom", label: "Bedroom(s)" },
            { value: "basement", label: "Basement" },
            { value: "addition_adu", label: "Addition / ADU" },
          ],
        },
        {
          key: "currentCondition",
          label: "Current Condition",
          type: "select",
          options: [
            { value: "dated_functional", label: "Dated but functional" },
            { value: "needs_repairs", label: "Needs repairs" },
            { value: "partial_demo", label: "Partial demo / gut" },
            { value: "complete_gut", label: "Complete gut renovation" },
          ],
        },
      ],
    },
    {
      id: "scope",
      title: "Design Direction",
      fields: [
        {
          key: "designStyle",
          label: "Design Style",
          type: "multiselect",
          options: [
            { value: "modern", label: "Modern" },
            { value: "transitional", label: "Transitional" },
            { value: "traditional", label: "Traditional" },
            { value: "farmhouse", label: "Farmhouse" },
            { value: "coastal", label: "Coastal" },
            { value: "scandinavian", label: "Scandinavian" },
            { value: "industrial", label: "Industrial" },
          ],
        },
        { key: "renovationGoals", label: "Renovation Goals & Priorities", type: "textarea", placeholder: "What are your top priorities for this reno?", rows: 4 },
        { key: "knownConstraints", label: "Known Constraints", type: "textarea", placeholder: "Structural concerns, permits, HOA rules...", rows: 2 },
      ],
    },
    { id: "budget", title: "Budget & Timeline", fields: SHARED_BUDGET_FIELDS },
    ASSETS_STEP,
  ],

  developer_concept: [
    CONTACT_STEP,
    {
      id: "property",
      title: "Property & Deal",
      fields: [
        { key: "lotSizeSqFt", label: "Lot Size (sq ft)", type: "numeric", placeholder: "10,000" },
        { key: "askingPrice", label: "Asking / Purchase Price", type: "text", placeholder: "$850,000" },
        {
          key: "developmentUseType",
          label: "Intended Use Type",
          type: "select",
          required: true,
          options: [
            { value: "single_family", label: "Single Family" },
            { value: "duplex_triplex", label: "Duplex / Triplex" },
            { value: "adu", label: "ADU / Accessory Dwelling" },
            { value: "multifamily", label: "Multifamily (4+ units)" },
            { value: "mixed_use", label: "Mixed-Use (retail + residential)" },
            { value: "commercial_office", label: "Commercial / Office" },
            { value: "industrial_flex", label: "Industrial / Flex" },
          ],
        },
        {
          key: "currentZoning",
          label: "Current Zoning (if known)",
          type: "text",
          placeholder: "e.g. R-2, MU-4, C-1",
        },
      ],
    },
    {
      id: "goals",
      title: "Investment Goals",
      fields: [
        {
          key: "investmentStrategy",
          label: "Investment Strategy",
          type: "radio",
          required: true,
          options: [
            { value: "build_sell", label: "Build & Sell" },
            { value: "build_hold", label: "Build & Hold / Rent" },
            { value: "flip", label: "Flip / Value-Add" },
            { value: "ground_up", label: "Ground-Up Development" },
          ],
        },
        { key: "projectDescription", label: "Project Description", type: "textarea", placeholder: "Describe the deal and what you're trying to accomplish...", rows: 4 },
        {
          key: "budgetRange",
          label: "Total Project Budget",
          type: "radio",
          required: true,
          options: [
            { value: "under_500k", label: "Under $500K" },
            { value: "500k_1m", label: "$500K – $1M" },
            { value: "1m_3m", label: "$1M – $3M" },
            { value: "3m_10m", label: "$3M – $10M" },
            { value: "10m_plus", label: "$10M+" },
          ],
        },
      ],
    },
  ],

  exterior_concept: [
    CONTACT_STEP,
    {
      id: "project",
      title: "Project Details",
      fields: [
        {
          key: "exteriorProjectType",
          label: "Type of Exterior Work",
          type: "radio",
          required: true,
          options: [
            { value: "facade_redesign", label: "Facade Redesign" },
            { value: "exterior_refresh", label: "Exterior Refresh" },
            { value: "landscape_redesign", label: "Landscape Redesign" },
            { value: "driveway_hardscape", label: "Driveway / Hardscape" },
            { value: "porch_deck_concept", label: "Porch / Deck Concept" },
            { value: "full_exterior", label: "Full Exterior" },
          ],
        },
        {
          key: "propertyUse",
          label: "Property Use",
          type: "select",
          options: [
            { value: "primary_residence", label: "Primary Residence" },
            { value: "rental", label: "Rental / Investment" },
            { value: "multifamily", label: "Multifamily" },
          ],
        },
      ],
    },
    {
      id: "scope",
      title: "Scope & Style",
      fields: [
        {
          key: "stylePreferences",
          label: "Style Preferences",
          type: "multiselect",
          options: [
            { value: "modern", label: "Modern / Contemporary" },
            { value: "traditional", label: "Traditional" },
            { value: "transitional", label: "Transitional" },
            { value: "craftsman", label: "Craftsman" },
            { value: "colonial", label: "Colonial" },
            { value: "mediterranean", label: "Mediterranean" },
            { value: "farmhouse", label: "Farmhouse" },
          ],
        },
        { key: "goals", label: "Project Goals", type: "textarea", placeholder: "What do you want to achieve?", rows: 4 },
        { key: "knownConstraints", label: "Known Constraints (HOA, setbacks, etc.)", type: "textarea", placeholder: "List any constraints...", rows: 3 },
      ],
    },
    { id: "budget", title: "Budget & Timeline", fields: SHARED_BUDGET_FIELDS },
    ASSETS_STEP,
  ],

  interior_renovation: [
    CONTACT_STEP,
    {
      id: "project",
      title: "Renovation Scope",
      fields: [
        {
          key: "roomScope",
          label: "Rooms to Renovate",
          type: "multiselect",
          required: true,
          options: [
            { value: "kitchen", label: "Kitchen" },
            { value: "primary_bath", label: "Primary Bathroom" },
            { value: "secondary_bath", label: "Secondary Bathroom" },
            { value: "living_room", label: "Living Room" },
            { value: "dining_room", label: "Dining Room" },
            { value: "bedroom", label: "Bedroom(s)" },
            { value: "basement", label: "Basement" },
            { value: "laundry", label: "Laundry / Utility" },
            { value: "other", label: "Other" },
          ],
        },
        {
          key: "currentCondition",
          label: "Current Condition",
          type: "select",
          options: [
            { value: "dated_but_functional", label: "Dated but functional" },
            { value: "needs_repairs", label: "Needs repairs" },
            { value: "partial_demo", label: "Partial demo / gut" },
            { value: "complete_gut", label: "Complete gut renovation" },
          ],
        },
      ],
    },
    {
      id: "scope",
      title: "Design Direction",
      fields: [
        {
          key: "designStyle",
          label: "Design Style",
          type: "multiselect",
          options: [
            { value: "modern", label: "Modern" },
            { value: "traditional", label: "Traditional" },
            { value: "transitional", label: "Transitional" },
            { value: "farmhouse", label: "Farmhouse" },
            { value: "scandinavian", label: "Scandinavian" },
            { value: "industrial", label: "Industrial" },
            { value: "coastal", label: "Coastal" },
          ],
        },
        { key: "renovationGoals", label: "Renovation Goals", type: "textarea", placeholder: "What are your top priorities?", rows: 4 },
        { key: "knownConstraints", label: "Known Constraints", type: "textarea", placeholder: "Budget limits, structural concerns...", rows: 3 },
      ],
    },
    { id: "budget", title: "Budget & Timeline", fields: SHARED_BUDGET_FIELDS },
    ASSETS_STEP,
  ],

  whole_home_remodel: [
    CONTACT_STEP,
    {
      id: "project",
      title: "Home Details",
      fields: [
        { key: "squareFootage", label: "Approximate Square Footage", type: "numeric", placeholder: "2400" },
        {
          key: "bedroomCount",
          label: "Number of Bedrooms",
          type: "select",
          options: [
            { value: "2", label: "2 bedrooms" },
            { value: "3", label: "3 bedrooms" },
            { value: "4", label: "4 bedrooms" },
            { value: "5plus", label: "5+ bedrooms" },
          ],
        },
        {
          key: "propertyUse",
          label: "Property Use",
          type: "select",
          options: [
            { value: "primary_residence", label: "Primary Residence" },
            { value: "rental", label: "Rental / Investment" },
            { value: "vacation_home", label: "Vacation Home" },
          ],
        },
      ],
    },
    {
      id: "scope",
      title: "Remodel Scope",
      fields: [
        {
          key: "remodelingScope",
          label: "Areas to Remodel",
          type: "multiselect",
          options: [
            { value: "kitchen", label: "Kitchen" },
            { value: "bathrooms", label: "Bathrooms" },
            { value: "primary_suite", label: "Primary Suite" },
            { value: "living_areas", label: "Living Areas" },
            { value: "basement", label: "Basement" },
            { value: "exterior", label: "Exterior" },
            { value: "full_property", label: "Full Property" },
          ],
        },
        {
          key: "designStyle",
          label: "Design Style",
          type: "multiselect",
          options: [
            { value: "modern", label: "Modern / Contemporary" },
            { value: "traditional", label: "Traditional" },
            { value: "transitional", label: "Transitional" },
            { value: "luxury", label: "Luxury" },
            { value: "farmhouse", label: "Farmhouse" },
          ],
        },
        { key: "priorities", label: "Top Priorities", type: "textarea", placeholder: "What matters most to you?", rows: 4 },
        { key: "knownConstraints", label: "Known Constraints", type: "textarea", placeholder: "HOA rules, structural concerns...", rows: 3 },
      ],
    },
    {
      id: "budget",
      title: "Budget & Financing",
      fields: [
        {
          key: "budgetRange",
          label: "Estimated Budget",
          type: "radio",
          required: true,
          options: [
            { value: "under_100k", label: "Under $100K" },
            { value: "100k_250k", label: "$100K – $250K" },
            { value: "250k_500k", label: "$250K – $500K" },
            { value: "500k_1m", label: "$500K – $1M" },
            { value: "1m_plus", label: "$1M+" },
          ],
        },
        {
          key: "financingStatus",
          label: "How are you financing?",
          type: "select",
          options: [
            { value: "cash", label: "Cash" },
            { value: "construction_loan", label: "Construction Loan" },
            { value: "home_equity", label: "Home Equity / HELOC" },
            { value: "refinance", label: "Cash-Out Refinance" },
            { value: "not_sure", label: "Not sure yet" },
          ],
        },
        {
          key: "timelineGoal",
          label: "When do you want to start?",
          type: "radio",
          options: [
            { value: "asap", label: "As soon as possible" },
            { value: "1_3_months", label: "1–3 months" },
            { value: "3_6_months", label: "3–6 months" },
            { value: "6_12_months", label: "6–12 months" },
            { value: "planning", label: "Just planning ahead" },
          ],
        },
      ],
    },
    ASSETS_STEP,
  ],

  addition_expansion: [
    CONTACT_STEP,
    {
      id: "project",
      title: "Addition Details",
      fields: [
        {
          key: "additionType",
          label: "Type of Addition",
          type: "radio",
          required: true,
          options: [
            { value: "rear_addition", label: "Rear Addition" },
            { value: "side_addition", label: "Side Addition" },
            { value: "vertical_addition", label: "Vertical (Second Floor)" },
            { value: "garage_addition", label: "Garage Addition" },
            { value: "adu_unit", label: "ADU / In-Law Suite" },
            { value: "sunroom", label: "Sunroom / Screened Porch" },
          ],
        },
        { key: "existingSquareFootage", label: "Existing Home Square Footage", type: "numeric", placeholder: "1800" },
        { key: "targetAdditionalSqft", label: "Approximate Square Footage to Add", type: "numeric", placeholder: "400" },
        {
          key: "additionUseCase",
          label: "What will the addition be used for?",
          type: "select",
          options: [
            { value: "primary_bedroom", label: "Primary Bedroom / Suite" },
            { value: "bedroom", label: "Bedroom(s)" },
            { value: "bathroom", label: "Bathroom" },
            { value: "living_space", label: "Living / Family Room" },
            { value: "home_office", label: "Home Office" },
            { value: "in_law_suite", label: "In-Law / Guest Suite" },
            { value: "kitchen_expansion", label: "Kitchen Expansion" },
            { value: "other", label: "Other" },
          ],
        },
      ],
    },
    {
      id: "scope",
      title: "Scope & Constraints",
      fields: [
        { key: "hasArchitect", label: "Do you already have an architect or designer?", type: "boolean" },
        { key: "neighborhoodConstraints", label: "Neighborhood / Zoning Constraints", type: "textarea", placeholder: "HOA restrictions, setback requirements...", rows: 3 },
        { key: "goals", label: "Project Goals", type: "textarea", placeholder: "Why are you adding this space?", rows: 4 },
      ],
    },
    { id: "budget", title: "Budget & Timeline", fields: SHARED_BUDGET_FIELDS },
    ASSETS_STEP,
  ],

  design_build: [
    CONTACT_STEP,
    {
      id: "project",
      title: "Project Overview",
      fields: [
        {
          key: "projectScale",
          label: "Project Scale",
          type: "radio",
          required: true,
          options: [
            { value: "small", label: "Small (under $100K)" },
            { value: "medium", label: "Medium ($100K–$500K)" },
            { value: "large", label: "Large ($500K–$1M)" },
            { value: "luxury", label: "Luxury ($1M+)" },
          ],
        },
        {
          key: "currentStage",
          label: "Current Project Stage",
          type: "radio",
          options: [
            { value: "idea_stage", label: "Idea stage — no plans yet" },
            { value: "concept_developed", label: "Concept developed" },
            { value: "has_plans", label: "Have architectural plans" },
            { value: "ready_to_build", label: "Plans approved, ready to build" },
          ],
        },
      ],
    },
    {
      id: "scope",
      title: "Design + Build Scope",
      fields: [
        {
          key: "designBuildScope",
          label: "Services Needed",
          type: "multiselect",
          options: [
            { value: "architecture", label: "Architecture / Engineering" },
            { value: "interior_design", label: "Interior Design" },
            { value: "construction", label: "Construction Management" },
            { value: "permitting", label: "Permitting" },
            { value: "landscaping", label: "Landscaping" },
            { value: "full_service", label: "Full Design-Build" },
          ],
        },
        { key: "hasExistingDesigns", label: "Do you have existing plans or designs to share?", type: "boolean" },
        { key: "deliverables", label: "Desired Project Outcomes", type: "textarea", placeholder: "Describe what a successful project looks like.", rows: 4 },
        { key: "knownConstraints", label: "Known Constraints", type: "textarea", placeholder: "Site constraints, zoning, budget limits...", rows: 3 },
      ],
    },
    { id: "budget", title: "Budget & Timeline", fields: SHARED_BUDGET_FIELDS },
    ASSETS_STEP,
  ],

  permit_path_only: [
    CONTACT_STEP,
    {
      id: "project",
      title: "Permit Details",
      fields: [
        {
          key: "permitType",
          label: "Type of Permit",
          type: "radio",
          required: true,
          options: [
            { value: "residential_renovation", label: "Residential Renovation" },
            { value: "addition", label: "Addition" },
            { value: "new_construction", label: "New Construction" },
            { value: "adu", label: "ADU" },
            { value: "deck_fence", label: "Deck / Fence" },
            { value: "commercial", label: "Commercial" },
          ],
        },
        { key: "permitJurisdiction", label: "Jurisdiction / County", type: "text", placeholder: "e.g. Montgomery County, MD", required: true },
        {
          key: "currentApprovalStatus",
          label: "Current Approval Status",
          type: "select",
          options: [
            { value: "not_started", label: "Not started" },
            { value: "pre_application", label: "Pre-application meeting scheduled" },
            { value: "application_submitted", label: "Application submitted" },
            { value: "revisions_requested", label: "Revisions requested" },
            { value: "approved", label: "Approved" },
          ],
        },
      ],
    },
    {
      id: "scope",
      title: "Project Description",
      fields: [
        { key: "projectDescription", label: "Project Description", type: "textarea", placeholder: "Describe the scope of work requiring permits...", rows: 5, required: true },
        { key: "knownConstraints", label: "Known Issues or Constraints", type: "textarea", placeholder: "Previous violations, neighbor disputes...", rows: 3 },
      ],
    },
    {
      id: "budget",
      title: "Budget & Timeline",
      fields: [
        {
          key: "budgetRange",
          label: "Project Budget (approx.)",
          type: "radio",
          options: [
            { value: "under_50k", label: "Under $50K" },
            { value: "50k_150k", label: "$50K – $150K" },
            { value: "150k_300k", label: "$150K – $300K" },
            { value: "300k_plus", label: "$300K+" },
          ],
        },
        {
          key: "timelineGoal",
          label: "Target Approval Timeline",
          type: "radio",
          options: [
            { value: "asap", label: "Urgent — as soon as possible" },
            { value: "1_3_months", label: "1–3 months" },
            { value: "3_6_months", label: "3–6 months" },
            { value: "flexible", label: "Flexible" },
          ],
        },
      ],
    },
    ASSETS_STEP,
  ],

  kitchen_remodel: [
    CONTACT_STEP,
    {
      id: "project",
      title: "Kitchen Details",
      fields: [
        {
          key: "kitchenProjectType",
          label: "Type of Kitchen Remodel",
          type: "radio",
          options: [
            { value: "cosmetic", label: "Cosmetic update (paint, hardware, fixtures)" },
            { value: "partial", label: "Partial remodel (cabinets or countertops)" },
            { value: "full", label: "Full kitchen remodel" },
            { value: "layout_change", label: "Full remodel with layout change" },
          ],
        },
        { key: "projectDescription", label: "Describe your kitchen goals", type: "textarea", placeholder: "What do you want to change or improve?", rows: 4 },
        { key: "knownConstraints", label: "Known Constraints", type: "textarea", placeholder: "Load-bearing walls, plumbing location, HOA rules...", rows: 3 },
      ],
    },
    {
      id: "style",
      title: "Style & Budget",
      fields: [
        {
          key: "stylePreferences",
          label: "Preferred Kitchen Style",
          type: "multiselect",
          options: [
            { value: "modern", label: "Modern / Contemporary" },
            { value: "transitional", label: "Transitional" },
            { value: "traditional", label: "Traditional / Classic" },
            { value: "farmhouse", label: "Farmhouse" },
            { value: "industrial", label: "Industrial" },
          ],
        },
        ...SHARED_BUDGET_FIELDS,
      ],
    },
    ASSETS_STEP,
  ],

  bathroom_remodel: [
    CONTACT_STEP,
    {
      id: "project",
      title: "Bathroom Details",
      fields: [
        {
          key: "bathroomProjectType",
          label: "Type of Bathroom Remodel",
          type: "radio",
          options: [
            { value: "cosmetic", label: "Cosmetic update (fixtures, tile, paint)" },
            { value: "partial", label: "Partial remodel (shower or vanity)" },
            { value: "full", label: "Full bathroom remodel" },
            { value: "addition", label: "New bathroom addition" },
          ],
        },
        { key: "projectDescription", label: "Describe your bathroom goals", type: "textarea", placeholder: "What do you want to change or improve?", rows: 4 },
        { key: "knownConstraints", label: "Known Constraints", type: "textarea", placeholder: "Plumbing location, wet wall access, HOA rules...", rows: 3 },
      ],
    },
    {
      id: "style",
      title: "Style & Budget",
      fields: [
        {
          key: "stylePreferences",
          label: "Preferred Bathroom Style",
          type: "multiselect",
          options: [
            { value: "modern", label: "Modern / Spa" },
            { value: "transitional", label: "Transitional" },
            { value: "traditional", label: "Traditional / Classic" },
            { value: "farmhouse", label: "Farmhouse" },
            { value: "luxury", label: "Luxury" },
          ],
        },
        ...SHARED_BUDGET_FIELDS,
      ],
    },
    ASSETS_STEP,
  ],

  capture_site_concept: [
    CONTACT_STEP,
    {
      id: "capture",
      title: "Site Capture",
      fields: [
        {
          key: "captureGoal",
          label: "What would you like to capture?",
          type: "radio",
          options: [
            { value: "exterior_only", label: "Exterior only" },
            { value: "interior_only", label: "Interior only" },
            { value: "full_property", label: "Full property (interior + exterior)" },
            { value: "specific_area", label: "Specific area or room" },
          ],
        },
        { key: "projectDescription", label: "Describe your project vision", type: "textarea", placeholder: "What are you hoping to build, renovate, or explore?", rows: 4 },
      ],
    },
    ASSETS_STEP,
  ],

  // ── Commercial / developer paths ─────────────────────────────────────────────

  multi_unit_residential: [
    CONTACT_STEP,
    {
      id: "site",
      title: "Site & Zoning",
      fields: [
        { key: "lotSizeSqFt", label: "Lot Size (sq ft)", type: "numeric", placeholder: "10000", required: true },
        { key: "askingPrice", label: "Land / Acquisition Cost ($)", type: "numeric", placeholder: "500000", required: true },
        { key: "zoningCode", label: "Zoning Code (if known)", type: "text", placeholder: "e.g. R-3, MU-2" },
        { key: "jurisdiction", label: "City / Jurisdiction", type: "text", placeholder: "e.g. Los Angeles, CA" },
      ],
    },
    {
      id: "program",
      title: "Development Program",
      fields: [
        { key: "totalGfaSqFt", label: "Target GFA (sq ft, optional)", type: "numeric", placeholder: "15000" },
        {
          key: "targetDevelopmentType",
          label: "Preferred Unit Type",
          type: "radio",
          options: [
            { value: "low_rise_apartment", label: "Low-Rise Apartment (3 stories or less)" },
            { value: "mid_rise_apartment", label: "Mid-Rise Apartment (4–8 stories)" },
            { value: "adu_portfolio", label: "ADU Portfolio" },
          ],
        },
        { key: "targetRoiPct", label: "Target ROI / IRR (%)", type: "numeric", placeholder: "15" },
        { key: "notes", label: "Additional Notes", type: "textarea", rows: 3 },
      ],
    },
  ],

  mixed_use: [
    CONTACT_STEP,
    {
      id: "site",
      title: "Site & Zoning",
      fields: [
        { key: "lotSizeSqFt", label: "Lot Size (sq ft)", type: "numeric", placeholder: "20000", required: true },
        { key: "askingPrice", label: "Land / Acquisition Cost ($)", type: "numeric", placeholder: "1200000", required: true },
        { key: "zoningCode", label: "Zoning Code", type: "text", placeholder: "e.g. MU-3, C-2" },
        { key: "jurisdiction", label: "City / Jurisdiction", type: "text", placeholder: "e.g. Seattle, WA" },
      ],
    },
    {
      id: "program",
      title: "Development Program",
      fields: [
        { key: "totalGfaSqFt", label: "Target GFA (sq ft)", type: "numeric", placeholder: "40000" },
        { key: "targetRoiPct", label: "Target IRR (%)", type: "numeric", placeholder: "14" },
        { key: "notes", label: "Additional Notes / Retail Tenants in Mind?", type: "textarea", rows: 3 },
      ],
    },
  ],

  commercial_office: [
    CONTACT_STEP,
    {
      id: "program",
      title: "Space Program",
      fields: [
        { key: "totalGfaSqFt", label: "Total Office Area (sq ft)", type: "numeric", placeholder: "25000", required: true },
        { key: "askingPrice", label: "Fit-Out Budget ($)", type: "numeric", placeholder: "750000" },
        {
          key: "officeLayout",
          label: "Preferred Layout",
          type: "radio",
          options: [
            { value: "open_plan", label: "Open Plan" },
            { value: "private_office", label: "Private Offices" },
            { value: "hybrid", label: "Hybrid (open + private)" },
          ],
        },
        { key: "headcount", label: "Approximate Headcount", type: "numeric", placeholder: "50" },
        { key: "notes", label: "Workplace Priorities or Requirements", type: "textarea", rows: 3 },
      ],
    },
  ],

  development_feasibility: [
    CONTACT_STEP,
    {
      id: "site",
      title: "Site & Acquisition",
      fields: [
        { key: "lotSizeSqFt", label: "Lot / Site Size (sq ft)", type: "numeric", placeholder: "43560", required: true },
        { key: "askingPrice", label: "Asking / Acquisition Price ($)", type: "numeric", placeholder: "2000000", required: true },
        { key: "zoningCode", label: "Zoning Code", type: "text", placeholder: "e.g. MU-3, C-2" },
        { key: "jurisdiction", label: "City / Jurisdiction", type: "text", required: true },
      ],
    },
    {
      id: "goals",
      title: "Development Vision",
      fields: [
        {
          key: "targetDevelopmentType",
          label: "Preferred Development Type",
          type: "radio",
          options: [
            { value: "mid_rise_apartment", label: "Mid-Rise Residential" },
            { value: "mixed_use_residential", label: "Mixed-Use" },
            { value: "commercial_office", label: "Commercial Office" },
            { value: "low_rise_apartment", label: "Low-Rise Residential" },
          ],
        },
        { key: "targetRoiPct", label: "Target IRR (%)", type: "numeric", placeholder: "18" },
        { key: "equityAvailable", label: "Equity Available ($)", type: "numeric", placeholder: "500000" },
        { key: "notes", label: "Known Constraints or Opportunities", type: "textarea", rows: 3 },
      ],
    },
  ],

  townhome_subdivision: [
    CONTACT_STEP,
    {
      id: "site",
      title: "Site Details",
      fields: [
        { key: "lotSizeSqFt", label: "Total Site Area (sq ft)", type: "numeric", placeholder: "87120", hint: "87,120 sf = 2 acres", required: true },
        { key: "askingPrice", label: "Land Acquisition Cost ($)", type: "numeric", placeholder: "1200000", required: true },
        { key: "zoningCode", label: "Zoning Code", type: "text", placeholder: "e.g. R-3, PUD" },
        { key: "jurisdiction", label: "City / Jurisdiction", type: "text", required: true },
      ],
    },
    {
      id: "program",
      title: "Subdivision Program",
      fields: [
        { key: "targetLotCount", label: "Target Unit Count (optional — AI will optimise)", type: "numeric", placeholder: "24" },
        { key: "targetLotWidthFt", label: "Preferred Lot Width (ft)", type: "numeric", placeholder: "22" },
        {
          key: "buildToSell",
          label: "Development Strategy",
          type: "radio",
          options: [
            { value: "true", label: "Build-to-sell (full construction)" },
            { value: "false", label: "Horizontal only (sell improved lots to a builder)" },
          ],
        },
        { key: "targetSalesPrice", label: "Target Sales Price per Unit ($)", type: "numeric", placeholder: "490000" },
        { key: "notes", label: "Additional Notes", type: "textarea", rows: 3 },
      ],
    },
  ],

  single_family_subdivision: [
    CONTACT_STEP,
    {
      id: "site",
      title: "Site Details",
      fields: [
        { key: "lotSizeSqFt", label: "Total Site Area (sq ft)", type: "numeric", placeholder: "217800", hint: "217,800 sf = 5 acres", required: true },
        { key: "askingPrice", label: "Land Acquisition Cost ($)", type: "numeric", placeholder: "2500000", required: true },
        { key: "zoningCode", label: "Zoning Code", type: "text", placeholder: "e.g. R-1, R-2" },
        { key: "jurisdiction", label: "City / Jurisdiction", type: "text", required: true },
      ],
    },
    {
      id: "program",
      title: "Subdivision Program",
      fields: [
        { key: "targetLotCount", label: "Target Lot Count (optional)", type: "numeric", placeholder: "18" },
        { key: "targetLotWidthFt", label: "Typical Lot Width (ft)", type: "numeric", placeholder: "60" },
        {
          key: "buildToSell",
          label: "Development Strategy",
          type: "radio",
          options: [
            { value: "true", label: "Build-to-sell (full construction)" },
            { value: "false", label: "Horizontal only (sell finished lots)" },
          ],
        },
        { key: "targetSalesPrice", label: "Target Sales Price per Home ($)", type: "numeric", placeholder: "625000" },
        { key: "notes", label: "Additional Notes", type: "textarea", rows: 3 },
      ],
    },
  ],

  single_lot_development: [
    CONTACT_STEP,
    {
      id: "site",
      title: "Lot Details",
      fields: [
        { key: "lotSizeSqFt", label: "Lot Size (sq ft)", type: "numeric", placeholder: "7500", required: true },
        { key: "askingPrice", label: "Lot / Acquisition Cost ($)", type: "numeric", placeholder: "350000", required: true },
        { key: "zoningCode", label: "Zoning Code", type: "text", placeholder: "e.g. R-2, R-MF" },
        { key: "jurisdiction", label: "City / Jurisdiction", type: "text", required: true },
      ],
    },
    {
      id: "program",
      title: "Building Program",
      fields: [
        {
          key: "preferredBuildingType",
          label: "Preferred Building Type",
          type: "radio",
          options: [
            { value: "single_family", label: "Single-Family Home (SFR)" },
            { value: "duplex", label: "Duplex (2 units)" },
            { value: "triplex", label: "Triplex (3 units)" },
          ],
        },
        {
          key: "intendToSell",
          label: "Exit Strategy",
          type: "radio",
          options: [
            { value: "true", label: "Sell on completion" },
            { value: "false", label: "Hold and rent" },
          ],
        },
        { key: "targetSalesPrice", label: "Target Sales Price per Unit ($, optional)", type: "numeric", placeholder: "650000" },
        { key: "targetRentPerUnit", label: "Target Monthly Rent per Unit ($, optional)", type: "numeric", placeholder: "3200" },
        { key: "notes", label: "Additional Notes", type: "textarea", rows: 3 },
      ],
    },
  ],
};
