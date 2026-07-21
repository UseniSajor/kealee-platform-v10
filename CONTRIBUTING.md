# Contributing to Kealee Platform

## Branch Strategy

The Kealee Platform uses the following branch strategy. All team members and AI Agents must adhere to these guidelines:

- `main` - Production-ready code only. Do not commit here directly.
- `develop` - Integration branch for all active development.
- `feature/*` - All new work and features.
- `hotfix/*` - Urgent production fixes.
- `release/*` - Release preparation branches.

## AI Agent Rules

> [!WARNING]
> **No AI Agent is permitted to commit directly to the `main` branch under any circumstances.**

All AI agents must:
1. Work exclusively in `feature/*`, `hotfix/*`, or `develop` branches unless explicitly instructed otherwise.
2. Read and respect `.github/ISSUE_TEMPLATE` guidelines when addressing issues.
3. Not push changes to `main` without Human review and standard PR process.
