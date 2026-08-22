/**
 * These suites do real SHA-256 hashing and build the 51-rule Prince George's
 * pack at module scope. Under parallel workers on a Windows-backed filesystem
 * the I/O contention pushes individual tests past Jest's default 5s, and three
 * suites fail intermittently — a flaky suite is worse than a slow one, because
 * nobody can tell a real regression from noise.
 *
 * `testTimeout` is not a valid per-project option in Jest 29, so the timeout is
 * set here instead, scoped to this project only.
 */
jest.setTimeout(30_000)
