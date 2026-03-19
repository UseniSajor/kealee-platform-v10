export interface CountyData {
  slug: string
  name: string
  shortName: string
  state: string
  simpleTimeline: string
  additionTimeline: string
  newConstructionTimeline: string
  commercialTimeline: string
  topDelays: { title: string; desc: string }[]
  jurisdictionNote: string
  portalName?: string
}

export const COUNTIES: CountyData[] = [
  {
    slug: 'prince-william-county',
    name: 'Prince William County, VA',
    shortName: 'Prince William County',
    state: 'VA',
    simpleTimeline: '2–6 weeks',
    additionTimeline: '4–10 weeks',
    newConstructionTimeline: '2–4 months',
    commercialTimeline: '4–8+ months',
    topDelays: [
      {
        title: 'Plans Not Permit-Ready',
        desc: 'Incomplete or non-compliant plan sets are the single largest cause of rejection cycles in this jurisdiction.',
      },
      {
        title: 'Zoning + Building Misalignment',
        desc: 'Adds 30–90 days when zoning approvals and building permits are not coordinated in advance.',
      },
      {
        title: 'Revision Cycles',
        desc: 'Each resubmission adds 2–4 weeks to your timeline. Multiple cycles compound quickly.',
      },
    ],
    jurisdictionNote:
      'Prince William County uses the PRISM online portal. High submission volume means plan review queues can run 3–5 weeks even for simple projects.',
    portalName: 'PRISM Online Portal',
  },
  {
    slug: 'fairfax-county',
    name: 'Fairfax County, VA',
    shortName: 'Fairfax County',
    state: 'VA',
    simpleTimeline: '3–8 weeks',
    additionTimeline: '6–12 weeks',
    newConstructionTimeline: '3–6 months',
    commercialTimeline: '6–12+ months',
    topDelays: [
      {
        title: 'High Volume, Limited Reviewer Bandwidth',
        desc: 'Fairfax processes thousands of permits per month. Reviewer queues are consistently backlogged regardless of season.',
      },
      {
        title: 'Zoning Overlay Complexity',
        desc: 'Especially near the Dulles corridor, overlay districts add requirements that catch unprepared applicants off-guard.',
      },
      {
        title: 'Incomplete Structural Documentation',
        desc: 'Missing engineer stamps, load calculations, or connection details trigger immediate resubmission requests.',
      },
    ],
    jurisdictionNote:
      'Fairfax County is one of the highest-volume permit jurisdictions in Virginia. Their online portal (LandFX) is robust but reviewer queues are consistently long.',
    portalName: 'LandFX Portal',
  },
  {
    slug: 'montgomery-county',
    name: 'Montgomery County, MD',
    shortName: 'Montgomery County',
    state: 'MD',
    simpleTimeline: '2–6 weeks',
    additionTimeline: '6–14 weeks',
    newConstructionTimeline: '3–6 months',
    commercialTimeline: '6–12+ months',
    topDelays: [
      {
        title: 'Forest Conservation Compliance',
        desc: 'State-mandated forest conservation reviews add significant time and require coordinated documentation.',
      },
      {
        title: 'Zoning Overlay District Conflicts',
        desc: 'Montgomery has numerous overlay districts with unique requirements that frequently conflict with base zoning.',
      },
      {
        title: 'Multiple Agency Sign-Offs',
        desc: 'DPS, DEP, and SHA reviews must be coordinated simultaneously — a single missing approval holds the entire permit.',
      },
    ],
    jurisdictionNote:
      'Montgomery County requires separate reviews from DPS, DEP, and sometimes SHA. Forest conservation and impervious surface rules are strictly enforced.',
  },
  {
    slug: 'prince-georges-county',
    name: "Prince George's County, MD",
    shortName: "Prince George's County",
    state: 'MD',
    simpleTimeline: '3–8 weeks',
    additionTimeline: '8–16 weeks',
    newConstructionTimeline: '3–5 months',
    commercialTimeline: '6–12+ months',
    topDelays: [
      {
        title: 'Multi-Agency Review Requirements',
        desc: 'Multiple county departments must sign off independently, and coordination between them is the applicant\'s responsibility.',
      },
      {
        title: 'Understaffed Plan Review Office',
        desc: 'Chronic staffing constraints mean plan reviewers carry heavier caseloads than comparable jurisdictions.',
      },
      {
        title: 'Historic District Complications',
        desc: 'Several areas require Historic Preservation review, adding a parallel approval track with its own timeline.',
      },
    ],
    jurisdictionNote:
      "Prince George's County requires coordination across multiple agencies. Staffing constraints mean plan review cycles are longer than neighboring jurisdictions.",
  },
  {
    slug: 'washington-dc',
    name: 'Washington DC',
    shortName: 'Washington DC',
    state: 'DC',
    simpleTimeline: '4–10 weeks',
    additionTimeline: '8–16 weeks',
    newConstructionTimeline: '4–8 months',
    commercialTimeline: '8–18+ months',
    topDelays: [
      {
        title: 'DCRA Processing Backlog',
        desc: 'A well-documented, citywide backlog at DCRA affects every project type. Expedited review is available but adds cost.',
      },
      {
        title: 'Multi-Agency Sign-Offs',
        desc: 'DDOT, SHPO, and DCOP reviews can each add weeks or months to a timeline when triggered.',
      },
      {
        title: 'Historic District + ANC Reviews',
        desc: 'Advisory Neighborhood Commission comments and historic preservation reviews add layers unavailable to object or delay.',
      },
    ],
    jurisdictionNote:
      "DC's DCRA has a well-documented backlog. Historic preservation reviews (SHPO), DDOT coordination, and Advisory Neighborhood Commission comments can add months to timelines.",
    portalName: 'DCRA Online Portal',
  },
  {
    slug: 'loudoun-county',
    name: 'Loudoun County, VA',
    shortName: 'Loudoun County',
    state: 'VA',
    simpleTimeline: '2–5 weeks',
    additionTimeline: '4–8 weeks',
    newConstructionTimeline: '2–4 months',
    commercialTimeline: '4–8+ months',
    topDelays: [
      {
        title: 'Rapid Growth Straining Resources',
        desc: "Loudoun is one of the fastest-growing counties in the country. Development pressure has outpaced reviewer capacity.",
      },
      {
        title: 'Zoning Ordinance Rewrite Confusion',
        desc: 'The 2019 Zoning Ordinance Rewrite still causes confusion about which rules apply to specific parcels and project types.',
      },
      {
        title: 'VDOT Entrance Permit Coordination',
        desc: 'Projects requiring road access must coordinate with VDOT for entrance permits — a separate approval process entirely.',
      },
    ],
    jurisdictionNote:
      'Loudoun County is one of the fastest-growing jurisdictions in the country. Development pressure has strained review capacity, and the 2019 Zoning Ordinance Rewrite still causes confusion.',
  },
  {
    slug: 'baltimore',
    name: 'Baltimore, MD',
    shortName: 'Baltimore',
    state: 'MD',
    simpleTimeline: '4–10 weeks',
    additionTimeline: '8–16 weeks',
    newConstructionTimeline: '4–8 months',
    commercialTimeline: '6–14+ months',
    topDelays: [
      {
        title: 'City vs County Jurisdiction Confusion',
        desc: 'Baltimore City and Baltimore County are entirely separate jurisdictions. Filing in the wrong one wastes weeks.',
      },
      {
        title: 'DPS Backlog in Baltimore City',
        desc: "Baltimore City's Department of Public Works and DPS office carries chronic review backlogs affecting all project types.",
      },
      {
        title: 'MDE and State Agency Coordination',
        desc: 'Maryland Department of the Environment reviews are required for many projects and run on a separate timeline from local permits.',
      },
    ],
    jurisdictionNote:
      "Baltimore City and Baltimore County are separate jurisdictions with different processes. Baltimore City's DPS office has chronic backlog issues. Don't confuse the two.",
  },
]
