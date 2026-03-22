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
          label: "Type of Kitchen Work",
          type: "radio",
          required: true,
          options: [
            { value: "full_gut_remodel", label: "Full Gut Remodel" },
            { value: "cabinet_refresh", label: "Cabinet Refresh / Reface" },
            { value: "layout_change", label: "Layout Change" },
            { value: "countertop_upgrade", label: "Countertop Upgrade" },
            { value: "appliance_upgrade", label: "Appliance Upgrade" },
            { value: "full_custom", label: "Full Custom Kitchen" },
          ],
        },
        {
          key: "currentCondition",
          label: "Current Kitchen Condition",
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
            { value: "modern", label: "Modern / Contemporary" },
            { value: "traditional", label: "Traditional" },
            { value: "transitional", label: "Transitional" },
            { value: "farmhouse", label: "Farmhouse" },
            { value: "shaker", label: "Shaker" },
            { value: "industrial", label: "Industrial" },
          ],
        },
        { key: "goals", label: "Project Goals", type: "textarea", placeholder: "What do you want to achieve with your kitchen?", rows: 4 },
        { key: "knownConstraints", label: "Known Constraints", type: "textarea", placeholder: "Structural walls, plumbing locations...", rows: 3 },
      ],
    },
    { id: "budget", title: "Budget & Timeline", fields: SHARED_BUDGET_FIELDS },
    ASSETS_STEP,
  ],

  bathroom_remodel: [
    CONTACT_STEP,
    {
      id: "project",
      title: "Bathroom Details",
      fields: [
        {
          key: "bathroomType",
          label: "Which Bathroom?",
          type: "radio",
          required: true,
          options: [
            { value: "primary_bath", label: "Primary / Master Bath" },
            { value: "guest_bath", label: "Guest Bathroom" },
            { value: "powder_room", label: "Powder Room" },
            { value: "multiple_baths", label: "Multiple Bathrooms" },
          ],
        },
        {
          key: "bathroomProjectType",
          label: "Type of Bathroom Work",
          type: "radio",
          required: true,
          options: [
            { value: "full_gut_remodel", label: "Full Gut Remodel" },
            { value: "tile_fixtures", label: "Tile & Fixtures Update" },
            { value: "vanity_upgrade", label: "Vanity Upgrade" },
            { value: "walk_in_shower", label: "Walk-In Shower Conversion" },
            { value: "layout_change", label: "Layout Change" },
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
            { value: "modern", label: "Modern / Spa" },
            { value: "traditional", label: "Traditional" },
            { value: "transitional", label: "Transitional" },
            { value: "coastal", label: "Coastal" },
            { value: "minimalist", label: "Minimalist" },
          ],
        },
        { key: "goals", label: "Project Goals", type: "textarea", placeholder: "What do you want to achieve with your bathroom?", rows: 4 },
        { key: "knownConstraints", label: "Known Constraints", type: "textarea", placeholder: "Plumbing locations, structural concerns...", rows: 3 },
      ],
    },
    { id: "budget", title: "Budget & Timeline", fields: SHARED_BUDGET_FIELDS },
    ASSETS_STEP,
  ],

  capture_site_concept: [
    CONTACT_STEP,
    {
      id: "project",
      title: "Capture Details",
      fields: [
        {
          key: "captureScope",
          label: "What would you like to capture?",
          type: "multiselect",
          required: true,
          options: [
            { value: "full_exterior", label: "Full Exterior" },
            { value: "full_interior", label: "Full Interior" },
            { value: "specific_rooms", label: "Specific Rooms" },
            { value: "mechanical_systems", label: "Mechanical Systems" },
            { value: "problem_areas", label: "Problem Areas" },
            { value: "full_property", label: "Full Property (Interior + Exterior)" },
          ],
        },
        {
          key: "captureGoal",
          label: "Purpose of Capture",
          type: "select",
          options: [
            { value: "digital_twin", label: "Build a Digital Twin" },
            { value: "renovation_planning", label: "Renovation Planning" },
            { value: "insurance_documentation", label: "Insurance Documentation" },
            { value: "pre_listing", label: "Pre-Listing Documentation" },
            { value: "general_record", label: "General Property Record" },
          ],
        },
      ],
    },
    {
      id: "scope",
      title: "Additional Notes",
      fields: [
        { key: "specialInstructions", label: "Special Instructions", type: "textarea", placeholder: "Any areas to focus on or avoid?", rows: 4 },
      ],
    },
    ASSETS_STEP,
  ],
};
