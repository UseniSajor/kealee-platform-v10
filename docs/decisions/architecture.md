# Architecture Decisions

## Core Layers
- v10 = Execution Layer
- v20 = Operating System Layer

## Source of Truth
- ProjectOutput = Deliverables
- Prisma DB = System State

## Execution Rule
Stripe → ProjectOutput → Queue → Worker

This pipeline MUST NEVER break.

## AI System
Bots:
- DesignBot
- EstimateBot
- PermitBot
- ContractorBot

All bot outputs must include:
- summary
- recommendations
- nextStep
- conversion_product
- confidence
