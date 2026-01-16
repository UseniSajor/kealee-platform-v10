# Architect Hub (m-architect)

Professional design project management for architects.

## Features Implemented (Prompt 1.1)

✅ **Project Setup Wizard**
- Multi-step wizard linking to existing Project Owner projects
- Project type categorization (Residential, Commercial, Institutional, Mixed-Use)
- Phase definition (Pre-Design, Schematic Design, Design Development, Construction Documents)
- Team assignment with role-based permissions (Principal, Project Architect, Designer, Drafter)
- Client access portal for review and feedback
- Integration with project budget and timeline from Project Owner

## Database Schema

- `DesignProject` - Main design project model linked to Project Owner project
- `DesignPhaseInstance` - Phase instances for each project
- `DesignTeamMember` - Team members with roles
- `DesignDeliverable` - Placeholder for future prompts
- `ReviewComment` - Placeholder for future prompts

## API Endpoints

- `POST /architect/design-projects` - Create design project
- `GET /architect/design-projects` - List design projects
- `GET /architect/design-projects/available-projects` - Get available Project Owner projects
- `GET /architect/design-projects/:id` - Get design project
- `PATCH /architect/design-projects/:id` - Update design project
- `POST /architect/design-projects/:id/team-members` - Add team member

## Pages

- `/` - Home page
- `/projects` - Projects list
- `/projects/new` - Create new design project wizard
- `/projects/[id]` - Project detail page

## Next Steps

- Prompt 1.2: Implement design phase management
- Prompt 1.3: Build file management system
- Prompt 1.4: Create deliverable tracking system
