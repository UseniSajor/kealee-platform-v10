// packages/ui/src/components/marketing/images.ts
// Centralized Unsplash image constants for all marketing pages

export interface MarketingImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

// Helper to build Unsplash CDN URLs with consistent params
function unsplash(photoId: string, width: number, height: number, alt: string): MarketingImage {
  return {
    src: `https://images.unsplash.com/${photoId}?w=${width}&q=80&auto=format&fit=crop`,
    alt,
    width,
    height,
  };
}

// ─── Hero Background Images ─────────────────────────────────────────────────

export const heroImages = {
  /** Aerial view of large construction site with cranes */
  constructionSite: unsplash('photo-1504307651254-35680f356dfd', 1920, 1080, 'Aerial view of a construction site with cranes and workers'),
  /** Modern glass and steel building facade */
  modernArchitecture: unsplash('photo-1487958449943-2429e8be8625', 1920, 1080, 'Modern glass and steel building facade'),
  /** Construction workers on scaffolding at golden hour */
  constructionWorkers: unsplash('photo-1541888946425-d81bb19240f5', 1920, 1080, 'Construction workers on scaffolding at golden hour'),
  /** Steel frame building under construction */
  steelFrame: unsplash('photo-1581094794329-c8112a89af12', 1920, 1080, 'Modern building under construction with steel beams'),
  /** City skyline with tall buildings */
  citySkyline: unsplash('photo-1486406146926-c627a92ad1ab', 1920, 1080, 'City skyline with modern high-rise buildings'),
  /** Team meeting around a table */
  teamCollaboration: unsplash('photo-1517048676732-d65bc937f952', 1920, 1080, 'Team collaborating around a conference table'),
  /** Professional reviewing architectural plans */
  blueprintReview: unsplash('photo-1503387762-592deb58ef4e', 1920, 1080, 'Architectural blueprints being reviewed on a desk'),
  /** Modern residential home exterior */
  modernHome: unsplash('photo-1600585154340-be6161a56a0c', 1920, 1080, 'Modern residential home with clean architectural lines'),
  /** New construction homes – residential development with mixed commercial appeal */
  newConstructionHomes: unsplash('photo-1628744448840-55bdb2497bd4', 1920, 1080, 'New residential construction development with modern homes'),
};

// ─── Section / Feature Images ────────────────────────────────────────────────

export const sectionImages = {
  /** Person reviewing documents at desk */
  documentReview: unsplash('photo-1454165804606-c3d57bc86b40', 800, 600, 'Professional reviewing documents at a desk'),
  /** Calculator and financial planning */
  financialPlanning: unsplash('photo-1554224155-6726b3ff858f', 800, 600, 'Financial planning with calculator and documents'),
  /** Tape measure on construction materials */
  tapeMeasure: unsplash('photo-1460472178825-e5240623afd5', 800, 600, 'Tape measure on construction materials'),
  /** Business handshake */
  handshake: unsplash('photo-1521737711867-e3b97375f902', 800, 600, 'Business professionals shaking hands'),
  /** Team working together at table */
  teamwork: unsplash('photo-1600880292203-757bb62b4baf', 800, 600, 'Team working together around a table'),
  /** Workers at construction site */
  siteWorkers: unsplash('photo-1556761175-5973dc0f32e7', 800, 600, 'Construction workers at a building site'),
  /** Modern kitchen renovation */
  kitchenRenovation: unsplash('photo-1600596542815-ffad4c1539a9', 800, 600, 'Modern kitchen renovation with premium finishes'),
  /** Luxury interior design */
  luxuryInterior: unsplash('photo-1600607687939-ce8a6c25118c', 800, 600, 'Luxury home interior with modern design'),
  /** Home renovation in progress */
  homeRenovation: unsplash('photo-1560448204-e02f11c3d0e2', 800, 600, 'Home renovation project in progress'),
  /** Modern office workspace */
  officeWorkspace: unsplash('photo-1600880292089-90a7e086ee0c', 800, 600, 'Modern office workspace with technology'),
  /** Paperwork and documents on a desk */
  paperwork: unsplash('photo-1611348586804-61bf6c080437', 800, 600, 'Documents and paperwork organized on a desk'),
  /** Engineering and surveying */
  engineering: unsplash('photo-1581092160607-ee22621dd758', 800, 600, 'Engineering surveying equipment on site'),
  /** Concrete pouring at construction site */
  concretePour: unsplash('photo-1590274853856-f22d4d002c94', 800, 600, 'Concrete pouring at a construction site'),
  /** Architectural model */
  architecturalModel: unsplash('photo-1503387762-592deb58ef4e', 800, 600, 'Architectural model and design plans'),
};

// ─── Portal Preview Hero Images ──────────────────────────────────────────────
// Used as the top image on PortalPreview cards for each app

export const portalImages = {
  /** Project Owner Portal - beautiful modern home */
  projectOwner: unsplash('photo-1600585154340-be6161a56a0c', 800, 450, 'Modern home managed through Kealee Project Owner Portal'),
  /** Architect Portal - architectural design close-up */
  architect: unsplash('photo-1503387762-592deb58ef4e', 800, 450, 'Architectural blueprints and design tools'),
  /** Permits Portal - city government building */
  permits: unsplash('photo-1486406146926-c627a92ad1ab', 800, 450, 'City skyline representing permit jurisdictions'),
  /** Estimation Tool - blueprints with measurement tools */
  estimation: unsplash('photo-1454165804606-c3d57bc86b40', 800, 450, 'Cost estimation with documents and calculations'),
  /** Ops Services - busy construction site */
  opsServices: unsplash('photo-1504307651254-35680f356dfd', 800, 450, 'Construction operations on an active building site'),
  /** Marketplace - professionals collaborating */
  marketplace: unsplash('photo-1600880292203-757bb62b4baf', 800, 450, 'Construction professionals collaborating on a project'),
  /** Finance/Trust - financial documents */
  financeTrust: unsplash('photo-1554224155-6726b3ff858f', 800, 450, 'Financial planning and trust management'),
  /** Engineer - engineering equipment */
  engineer: unsplash('photo-1581092160607-ee22621dd758', 800, 450, 'Engineering and structural analysis work'),
  /** PM Software - project management dashboard and planning */
  pmSoftware: unsplash('photo-1460472178825-e5240623afd5', 800, 450, 'Project management planning and scheduling tools'),
  /** Pattern Book - pre-approved housing designs */
  patternBook: unsplash('photo-1600596542815-ffad4c1539a9', 800, 450, 'Pre-approved housing designs from the 21st Century Housing Act'),
  /** Dev Package Generator - AI feasibility analysis */
  devPackage: unsplash('photo-1551836022-4c4c79ecde51', 800, 450, 'AI-powered development feasibility analysis'),
  /** Workforce Housing - federal grants and financing */
  workforceHousing: unsplash('photo-1560518883-ce09059eeffa', 800, 450, 'Workforce housing and federal grant programs'),
};
