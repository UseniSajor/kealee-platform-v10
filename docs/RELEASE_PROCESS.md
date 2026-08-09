# Release Process for Kealee Platform

This document describes the release management process for the Kealee Platform, ensuring that changes transition safely from development to production.

---

## 1. Versioning Standard

We use Semantic Versioning (SemVer) with a custom prefix for major platform phases. 
For Kealee v30 (Loop Orchestration & Automation), all releases follow the version schema:

```
v30.<minor>.<patch>
```

- **Minor Version (`v30.X.0`):** Incremented when new loop types, integrations, portals, or major features are introduced.
- **Patch Version (`v30.X.Y`):** Incremented for bug fixes, performance improvements, copy corrections, or minor adjustments.

---

## 2. Release Pipeline Flow

The workflow diagram below details the release pipeline:

```
[Feature Branch]
       │
       ▼ (PR Approved & CI Passes)
   [develop]
       │
       ▼ (Create Release Branch)
[release/v30.X.Y]
       │
       ├─► Deployed to Staging / UAT
       │
       ▼ (Approved by QA / Product)
    [main]
       │
       ├─► Tagged Release (v30.X.Y)
       │
       ▼ (Automatic Production Deploy)
  Production
```

---

## 3. Step-by-Step Release Checklist

### Phase 1: Code Freeze and Release Prep
1. When development in `develop` is ready for a release, create a new release branch:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v30.1.0
   ```
2. Bump the package version in the root `package.json` (and workspace package files if necessary).
3. Commit the version bump:
   ```bash
   git commit -am "chore: release version v30.1.0"
   ```
4. Push the branch to GitHub:
   ```bash
   git push origin release/v30.1.0
   ```

### Phase 2: Staging Deployment & QA
1. The release branch is automatically deployed to the staging environment (or triggered manually via `pnpm deploy:staging`).
2. Run automated smoke tests:
   ```bash
   pnpm run test:smoke
   ```
3. Conduct manual User Acceptance Testing (UAT) and verify dashboard pages and API endpoints.
4. If bugs are found:
   - Commit fixes directly to the `release/v30.1.0` branch.
   - Deploy fixes to staging and re-verify.

### Phase 3: Merging to Production
1. Once testing completes and the release is approved, open two pull requests:
   - **PR 1:** `release/v30.1.0` ➔ `main`
   - **PR 2:** `release/v30.1.0` ➔ `develop` (to sync any release fixes back to development)
2. Ensure both PRs pass all CI checks.
3. Merge `release/v30.1.0` into `main` using a merge commit (do not squash, to preserve the release commits).
4. Tag the release on `main`:
   ```bash
   git checkout main
   git pull origin main
   git tag -a v30.1.0 -m "Release v30.1.0"
   git push origin v30.1.0
   ```
5. Merge `release/v30.1.0` into `develop`.
6. Delete the branch `release/v30.1.0`.

### Phase 4: Production Verification
1. Verifying production rollout:
   - The production deployment is triggered automatically on push/merge to `main`.
   - Run production-level smoke tests:
     ```bash
     pnpm run test:smoke:production
     ```
   - Verify health check endpoints (`/api/health`).
