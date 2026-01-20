# m-permits-inspections Deployment Guide - Remove Placeholders & Connect API

## Overview

This guide covers removing placeholder components in m-permits-inspections, connecting to the permit API, and testing permit application and inspection scheduling flows.

---

## Current Status

### Backend API
- ✅ Permit application routes: `services/api/src/modules/permits/permit-application.routes.ts`
- ✅ Permit routing routes: `services/api/src/modules/permits/permit-routing.routes.ts`
- ✅ Inspection routes: `services/api/src/modules/permits/inspection.routes.ts`
- ✅ Jurisdiction routes: `services/api/src/modules/permits/jurisdiction.routes.ts`

### Frontend (m-permits-inspections)
- ⚠️ Found 18+ placeholder/TODO components
- ⚠️ Need to connect to real API endpoints
- ⚠️ Need to replace mock data

---

## 1. Placeholder Components to Replace

### Identified Placeholders

1. **`permit-application-form.tsx`**
   - TODO: Implement draft saving
   - Multiple placeholder select values

2. **`business-rules-editor.tsx`**
   - TODO: Implement business rules editor

3. **`calendar-manager.tsx`**
   - TODO: Implement calendar manager

4. **`inspector-zone-manager.tsx`**
   - TODO: Implement inspector zone manager

5. **`review-discipline-config.tsx`**
   - TODO: Implement review discipline configuration

6. **`permit-type-config.tsx`**
   - TODO: Implement permit type configuration

---

## 2. API Integration

### Permit Application API

#### Create Permit Application
```bash
POST /permits/applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "project-uuid",
  "jurisdictionId": "jurisdiction-uuid",
  "permitTypeId": "permit-type-uuid",
  "priority": "normal",
  "address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94107"
  },
  "contactInfo": {
    "phone": "123-456-7890",
    "email": "applicant@example.com"
  },
  "projectDescription": "Residential renovation",
  "scopeOfWork": "Kitchen and bathroom remodel",
  "occupancyType": "residential",
  "constructionType": "renovation",
  "buildingUse": "Single-family residence"
}
```

Response:
```json
{
  "application": {
    "id": "application-uuid",
    "status": "submitted",
    "applicationNumber": "PER-2024-001",
    "submittedAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Get Permit Applications
```bash
GET /permits/applications?status=submitted&jurisdictionId=jurisdiction-uuid
Authorization: Bearer <token>
```

#### Update Permit Application
```bash
PATCH /permits/applications/:applicationId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "under_review",
  "notes": "Application received and assigned for review"
}
```

### Inspection API

#### Schedule Inspection
```bash
POST /permits/inspections
Authorization: Bearer <token>
Content-Type: application/json

{
  "applicationId": "application-uuid",
  "inspectionType": "foundation",
  "scheduledDate": "2024-01-20T10:00:00Z",
  "inspectorId": "inspector-uuid",
  "notes": "Initial foundation inspection"
}
```

#### Get Inspections
```bash
GET /permits/inspections?applicationId=application-uuid&status=scheduled
Authorization: Bearer <token>
```

#### Update Inspection
```bash
PATCH /permits/inspections/:inspectionId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "result": "passed",
  "notes": "Foundation meets code requirements",
  "photos": ["photo-url-1", "photo-url-2"]
}
```

### Jurisdiction API

#### Get Jurisdictions
```bash
GET /permits/jurisdictions
Authorization: Bearer <token>
```

#### Get Permit Types
```bash
GET /permits/jurisdictions/:jurisdictionId/permit-types
Authorization: Bearer <token>
```

---

## 3. Component Replacement Guide

### Step 1: Permit Application Form

Replace placeholder selects with real API data:

```typescript
// apps/m-permits-inspections/src/components/permit/permit-application-form.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

export function PermitApplicationForm() {
  const [jurisdictions, setJurisdictions] = useState([]);
  const [permitTypes, setPermitTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch jurisdictions
        const jurisdictionsRes = await fetch('/api/permits/jurisdictions');
        const jurisdictionsData = await jurisdictionsRes.json();
        setJurisdictions(jurisdictionsData.jurisdictions || []);

        // Fetch user's projects
        const projectsRes = await fetch('/api/projects');
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  async function fetchPermitTypes(jurisdictionId: string) {
    try {
      const res = await fetch(`/api/permits/jurisdictions/${jurisdictionId}/permit-types`);
      const data = await res.json();
      setPermitTypes(data.permitTypes || []);
    } catch (error) {
      console.error('Failed to fetch permit types:', error);
    }
  }

  const { register, handleSubmit, watch } = useForm();

  const selectedJurisdiction = watch('jurisdictionId');

  useEffect(() => {
    if (selectedJurisdiction) {
      fetchPermitTypes(selectedJurisdiction);
    }
  }, [selectedJurisdiction]);

  async function onSubmit(data: any) {
    try {
      const response = await fetch('/api/permits/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to submit application');

      const result = await response.json();
      alert(`Application submitted: ${result.application.applicationNumber}`);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit application');
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Project Select */}
      <select {...register('projectId')}>
        <option value="">Select a project</option>
        {projects.map(project => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>

      {/* Jurisdiction Select */}
      <select {...register('jurisdictionId')}>
        <option value="">Select jurisdiction</option>
        {jurisdictions.map(jurisdiction => (
          <option key={jurisdiction.id} value={jurisdiction.id}>
            {jurisdiction.name}
          </option>
        ))}
      </select>

      {/* Permit Type Select */}
      <select {...register('permitTypeId')} disabled={!selectedJurisdiction}>
        <option value="">Select permit type</option>
        {permitTypes.map(type => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>

      {/* Rest of form fields */}
      <button type="submit">Submit Application</button>
    </form>
  );
}
```

### Step 2: Business Rules Editor

```typescript
// apps/m-permits-inspections/src/components/jurisdiction/business-rules-editor.tsx
'use client';

import { useState, useEffect } from 'react';

export function BusinessRulesEditor({ jurisdictionId }: { jurisdictionId: string }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRules() {
      try {
        const res = await fetch(`/api/permits/jurisdictions/${jurisdictionId}/business-rules`);
        const data = await res.json();
        setRules(data.rules || []);
      } catch (error) {
        console.error('Failed to fetch rules:', error);
      } finally {
        setLoading(false);
      }
    }

    if (jurisdictionId) {
      fetchRules();
    }
  }, [jurisdictionId]);

  async function saveRule(rule: any) {
    try {
      const res = await fetch(`/api/permits/jurisdictions/${jurisdictionId}/business-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });

      if (!res.ok) throw new Error('Failed to save rule');

      // Refresh rules
      fetchRules();
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Business Rules</h2>
      {rules.map(rule => (
        <div key={rule.id}>
          <h3>{rule.name}</h3>
          <p>{rule.description}</p>
          <button onClick={() => saveRule(rule)}>Save</button>
        </div>
      ))}
    </div>
  );
}
```

### Step 3: Calendar Manager

```typescript
// apps/m-permits-inspections/src/components/jurisdiction/calendar-manager.tsx
'use client';

import { useState, useEffect } from 'react';

export function CalendarManager({ jurisdictionId }: { jurisdictionId: string }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch(`/api/permits/jurisdictions/${jurisdictionId}/calendar`);
        const data = await res.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    }

    if (jurisdictionId) {
      fetchEvents();
    }
  }, [jurisdictionId]);

  async function createEvent(event: any) {
    try {
      const res = await fetch(`/api/permits/jurisdictions/${jurisdictionId}/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      if (!res.ok) throw new Error('Failed to create event');

      // Refresh events
      fetchEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Calendar</h2>
      {/* Calendar component */}
      {events.map(event => (
        <div key={event.id}>
          <h3>{event.title}</h3>
          <p>{event.date}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 4. Testing Checklist

### Permit Application Flow

- [ ] Load permit application form
- [ ] Fetch and display jurisdictions
- [ ] Fetch and display permit types (based on jurisdiction)
- [ ] Fetch and display user's projects
- [ ] Fill out application form
- [ ] Submit application
- [ ] Verify application created in database
- [ ] Verify application number generated
- [ ] Check status updates

### Inspection Scheduling Flow

- [ ] View permit application
- [ ] Click "Schedule Inspection"
- [ ] Select inspection type
- [ ] Select date and time
- [ ] Select inspector
- [ ] Submit inspection request
- [ ] Verify inspection scheduled
- [ ] Check calendar updated
- [ ] Verify notifications sent

### Jurisdiction Management

- [ ] View jurisdiction list
- [ ] Edit jurisdiction settings
- [ ] Configure permit types
- [ ] Set up business rules
- [ ] Manage inspectors
- [ ] Configure calendar

---

## 5. API Route Setup

### Frontend API Routes

Create Next.js API routes to proxy to backend:

```typescript
// apps/m-permits-inspections/app/api/permits/applications/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getAuthToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // Get from cookies
  const cookies = request.cookies;
  return cookies.get('sb-access-token')?.value || null;
}

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/permits/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create application' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const response = await fetch(`${API_BASE_URL}/permits/applications${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch applications' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 6. Deployment Checklist

### Pre-Deployment

- [ ] All placeholder components identified
- [ ] API integration code written
- [ ] Mock data replaced
- [ ] Error handling added
- [ ] Loading states added
- [ ] Environment variables configured

### Deployment Steps

1. **Replace Placeholder Components**
   - Update permit-application-form.tsx
   - Implement business-rules-editor.tsx
   - Implement calendar-manager.tsx
   - Implement inspector-zone-manager.tsx
   - Implement review-discipline-config.tsx
   - Implement permit-type-config.tsx

2. **Create API Routes**
   - Create permit application routes
   - Create inspection routes
   - Create jurisdiction routes

3. **Deploy Backend API**
   ```bash
   cd services/api
   # Deploy to Railway/your platform
   ```

4. **Deploy Frontend**
   ```bash
   cd apps/m-permits-inspections
   npm run deploy:production
   ```

### Post-Deployment Testing

- [ ] Test permit application submission
- [ ] Test inspection scheduling
- [ ] Test jurisdiction management
- [ ] Verify all placeholders removed
- [ ] Check error handling
- [ ] Verify loading states

---

## 7. Next Steps

1. Replace all placeholder components
2. Connect to real API endpoints
3. Remove mock data
4. Add error handling
5. Add loading states
6. Test permit application flow
7. Test inspection scheduling
8. Deploy to staging
9. Perform end-to-end testing
10. Deploy to production
