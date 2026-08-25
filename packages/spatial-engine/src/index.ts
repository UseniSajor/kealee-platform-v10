/**
 * @kealee/pascal-agents
 *
 * Pure-data prompt library + agent orchestrator for the Pascal preconstruction
 * stack. Pairs with @kealee/pascal-wrapper.
 *
 * NOTE: Folder kept as `packages/spatial-engine/` during the rename refactor.
 * The published package name is `@kealee/pascal-agents`.
 */

export * from './agents';
export * as Prompts from './prompts';
export * from './gis-client';

// Site-plan engine — Prince George's County
export * from './site-plan/reliability';
export * from './site-plan/disturbance';
export * from './site-plan/classification';
export * from './jurisdictions/prince-georges-md';
export * from './jurisdictions/pg-overlays-and-dimensions';
export * from './jurisdictions/pg-subdivision-and-landscape'
export * from './jurisdictions/pg-subtitle-32';
export * from './jurisdictions/pg-elevation';
export * from './jurisdictions/pgatlas';
export * from './jurisdictions/pg-site-plan-code';
export * from './site-plan/site-twin';
export * from './site-plan/reports';
export * from './site-plan/engineering';
export * from './sheets/sheet-template';
export * from './sheets/viewport';
export * from './sheets/render-svg';
export * from './site-plan/design';
export * from './site-plan/required-notes';
export * from './site-plan/buildable-envelope';
export * from './export/exporters';
export * from './export/crs';
export * from './review/disciplines';
export * from './review/checklist';

// ── Phase 3B / 3C — namespaced so the large surfaces do not collide ─────────
// `Survey.parseSurveyCsv(...)`, `Rules.evaluateProjectRules(...)`,
// `Persistence.persistIngestionCycle(...)`.
export * as Survey from './survey/index';
export * as Rules from './rules/index';
export * as Persistence from './persistence/index';
export * as SitePlanOrders from './integration/index';
export * from './sheets/composer';
export * from './review/content-scope';
export * from './review/evidence';
