# v20 Integration Rules

v20 components MUST be used in runtime:
- DigitalTwin
- Parcel
- ZoningProfile
- FeasibilityStudy

## Rules
- Bots MUST use live DB data when available
- Static RAG is fallback only
- DigitalTwin MUST update on:
  - Project creation
  - ProjectOutput completion

## Execution Integration
All OS services MUST:
- create ProjectOutput
- enqueue project.execution

## Forbidden
- v20 logic without execution
- unused v20 schema
