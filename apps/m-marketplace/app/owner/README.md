# m-project-owner

Project Owner Dashboard - Kealee Platform

## Features

- **Project Creation Wizard** - Create projects in under 2 minutes
- **Dashboard** - View and manage all projects
- **Auto-save** - Drafts saved automatically every 5 seconds
- **Progress Tracking** - Visual progress indicators
- **Success States** - Celebratory completion flows

## UX Goals

- **Speed**: Project creation in < 2 minutes
- **Clarity**: Zero confusion, clear next steps
- **Forgiving**: Easy to go back, can skip optional fields
- **Feedback**: Instant validation and auto-save indicators

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Project Creation Flow

1. **Basics** - Name, location, type
2. **Scope** - Budget, timeline, description
3. **Contractors** - Choose how to find contractors
4. **Review** - Confirm and create

## API Routes

- `POST /api/projects/draft` - Save project draft
- `POST /api/projects` - Create new project

## Components Used

- `@kealee/ui` - Design system components
- Custom step indicator
- Auto-save functionality
- Form validation
