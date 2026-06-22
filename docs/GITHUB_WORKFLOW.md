# Kealee Platform GitHub Development Workflow

This document describes the professional GitHub development workflow for the Kealee Platform. It defines the rules, checks, structures, and project management standards that allow developers and AI agents to build quickly and safely.

---

## 1. Core Rule

> [!IMPORTANT]
> **No commits are allowed directly to `main` or `develop`.**
> All code must go through a branch pipeline, pass CI checks, and undergo human review.

---

## 2. Branching Strategy
We use a multi-branch git strategy to isolate active work from release candidates and production.

For detailed guidelines, see [Branching Strategy](file:///c:/Users/Tim%20Chamberlain/Documents/kealee-platform-v10/docs/BRANCHING_STRATEGY.md).
- `main`: Production-ready only.
- `develop`: Integration and testing branch.
- `feature/*`: New features, tasks, and enhancements.
- `hotfix/*`: Direct fixes for production bugs.
- `release/*`: Release candidate preparation and stabilization.

---

## 3. GitHub Issue System
All development tasks must start with a GitHub Issue using one of the templates:
- **Feature Request:** Propose new platform capabilities.
- **Bug Fix:** Repair broken logic or UI elements.
- **Agent Task:** Direct directives for AI development models.
- **Architecture Decision:** Propose database schema changes or major patterns.
- **Deployment Task:** Coordinate environment configuration or migrations.

Each issue must define:
1. **Goal:** What is being achieved.
2. **Context:** Background details, links, or designs.
3. **Files likely affected:** Recommended entry points.
4. **Acceptance criteria:** Explicit check-boxes.
5. **Testing requirements:** How to verify success.
6. **Risks:** High-risk areas to watch.
7. **Do-not-touch areas:** Strictly off-limit files or systems.

---

## 4. Protected Branches
The `main` and `develop` branches are protected using GitHub Branch Protection Rules:

| Policy | `main` | `develop` |
| :--- | :--- | :--- |
| **Require Pull Request** | Yes | Yes |
| **Require Reviews** | Yes (At least 1 approval) | Yes (At least 1 approval) |
| **Require Status Checks** | Yes (`Kealee Platform CI`) | Yes (`Kealee Platform CI`) |
| **Block Direct Pushes** | Yes | Yes |
| **Block Force Pushes** | Yes | Yes |
| **Linear History** | Recommended | Recommended |

---

## 5. Pull Request Rules
All work must end in a Pull Request (PR) matching the template in `.github/PULL_REQUEST_TEMPLATE.md`.

### Merge Gating Checklist
PRs cannot be merged unless:
- [ ] The GitHub Actions CI build passes.
- [ ] Linter is passing without errors.
- [ ] TypeScript check compiles with zero type errors.
- [ ] All unit and integration tests pass.
- [ ] At least one maintainer completes a review and approves.

---

## 6. GitHub Actions CI/CD
Our CI workflow is defined in `.github/workflows/ci.yml`. It runs on every PR targeting `main` or `develop`.

The pipeline executes the following checks:
1. **Checkout & Install:** Retrieves code and installs dependencies using `pnpm`.
2. **Prisma Validate:** Runs Prisma schema validation checks.
3. **Build Check:** Compiles the entire monorepo.
4. **Lint Check:** Ensures lint compliance.
5. **TypeScript Check:** Typechecks the TypeScript modules.
6. **Tests:** Runs the test suites.
7. **Security Scan:** Performs dependency security checks (`pnpm audit`).

---

## 7. Project Board Configuration
We track all repository issues and pull requests on a GitHub Project board with these columns:

1. **Backlog:** Ideas, requests, and un-prioritized issues.
2. **Ready:** Prioritized tasks ready for assignment.
3. **In Progress:** Active development.
4. **AI Built:** Task implemented by AI agent, waiting for local validation/tests.
5. **Human Review:** PR is open and awaiting code review.
6. **Testing:** PR is deployed to staging, undergoing QA and UAT.
7. **Production Ready:** Merged to `develop`, preparing for release branch.
8. **Deployed:** Released to `main` and running in production.

---

## 8. GitHub Labels
We tag issues and PRs with these standard labels to organize workflows:

- **Type/Role Labels:**
  - `agent-task`: Task intended for AI agents.
  - `ai-agent`: PR or issue handled/opened by an AI agent.
  - `needs-review`: PR is waiting for review or feedback.
  - `ready-to-merge`: PR has approved reviews and passing CI.
  - `urgent`: Immediate attention required.
  - `blocked`: Progress is stopped due to dependencies or design.
  - `bug`: Represents a bug fix.

- **Platform Component Labels:**
  - `backend`: Backend API, database, or queue tasks.
  - `frontend`: User portal or public site visual work.
  - `database`: Prisma schema migrations or seed files.
  - `loop-orchestration`: Loop routing, workers, and triggers.
  - `digital-twin`: Digital twin schemas or helper logic.

- **Kealee Domain Labels:**
  - `permit`: Building permits and inspections.
  - `estimate`: Estimation engines and pricing formulas.
  - `contractor`: Contractor portal and bid packages.
  - `pm`: Project management task workflows.
  - `developer`: Developer portal or zoning analysis tools.
  - `finance`: Loan calculations, escrow, or payment.
