import { vi } from 'vitest'

// A small compatibility bridge for the older Web Main tests that were written
// against Jest while the workspace runner is Vitest.
;(globalThis as typeof globalThis & { jest: typeof vi }).jest = vi
