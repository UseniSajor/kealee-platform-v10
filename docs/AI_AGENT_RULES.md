# AI Agent Rules for Kealee Platform

Welcome, Agent! You are playing a key role in developing and maintaining the Kealee Platform. To ensure system stability, security, and high engineering velocity without breaking production, you must adhere strictly to the following rules.

---

## Core Commandment

> [!IMPORTANT]
> **No AI Agent is permitted to commit or push directly to `main` or `develop`.**
> All agent work must be performed in a dedicated `feature/*` or `hotfix/*` branch and merged via a Pull Request.

---

## 1. Branching & Workspace Hygiene
- **Never push directly** to `main` or `develop`.
- **Always create or use a feature branch** (e.g., `feature/feature-name` or `agent/issue-id-description`).
- Before starting work on any task, confirm your current active branch.
- Keep your changes clean, isolated, and focused on the scope of the assigned issue.

## 2. Context & Code Inspection
- **Always read the README.md**, `docs/REPO_MEMORY.md`, and other system architecture guides before making any changes.
- **Inspect existing patterns** before writing new code. If a utility, pattern, database model, or handler exists for a task, reuse it. Do not reinvent or duplicate.
- **Do not duplicate services.** If we have an email service, a payment service, or an AI agent framework service, reuse it.
- **Do not introduce new architectural patterns** without checking current architecture and getting human approval via an Architecture Decision template.

## 3. Functionality & Safe Refactoring
- **Do not remove or alter existing functionality** unless the task explicitly requires it.
- **Preserve all unrelated comments and docstrings** to maintain documentation integrity.
- If refactoring is necessary, preserve public API contracts and ensure backward compatibility.

## 4. Testing & Verification
- **Always add or update tests** for modified or newly introduced logic.
- Verify your changes locally before submitting your work:
  - Check compilation: `pnpm build`
  - Run tests: `pnpm test`
  - Lint: `pnpm lint`

## 5. Documentation & Reporting
- **Always update documentation** whenever you introduce a new system, service, database model, or endpoint.
- **Always write a detailed PR description** using the provided template, summarizing:
  - What changed and why.
  - Linked issues.
  - Verification steps and outputs.
  - Rollback plan and risk evaluation.
