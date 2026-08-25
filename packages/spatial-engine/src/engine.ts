/**
 * Server-safe entry point for the site-plan engine.
 *
 * The package root (`./index.ts`) re-exports the Pascal editor, which reaches
 * `@react-three/drei` and therefore React. That is harmless in a browser bundle
 * and fatal anywhere else: an API route, a queue worker or a test importing the
 * root crashes on `Cannot find module 'react'`.
 *
 * This barrel carries the entire civil engine and nothing that touches the DOM,
 * so it is importable from Node. Consume it as `@kealee/pascal-agents/engine`.
 */

// Jurisdiction rule data
export * from './jurisdictions/prince-georges-md'
export * from './jurisdictions/pg-overlays-and-dimensions'
export * from './jurisdictions/pg-subdivision-and-landscape'
export * from './jurisdictions/pg-source-locators'
export * from './jurisdictions/pg-subtitle-32'
export * from './jurisdictions/fema-nfhl'
export * from './jurisdictions/pg-site-data'
export * from './jurisdictions/md-imap'
export * from './jurisdictions/pg-elevation'

// The digital site twin and the civil model
export * from './site-plan/reliability'
export * from './site-plan/site-twin'
export * from './site-plan/disturbance'
export * from './site-plan/classification'
export * from './site-plan/reports'
export * from './site-plan/engineering'
export * from './site-plan/design'
export * from './site-plan/required-notes'

// Sheets
export * from './sheets/sheet-template'
export * from './sheets/viewport'
export * from './sheets/composer'
export * from './sheets/render-svg'

// Export formats
export * from './export/crs'
export * from './export/exporters'

// Professional review
export * from './review/disciplines'
export * from './review/checklist'
export * from './review/content-scope'
export * from './review/evidence'

// GIS access
export * from './gis-client'

// Large surfaces, namespaced
export * as Survey from './survey/index'
export * as Rules from './rules/index'
export * as Persistence from './persistence/index'
export * as SitePlanOrders from './integration/index'
export * as SelfPerform from './self-perform/lot-package'
