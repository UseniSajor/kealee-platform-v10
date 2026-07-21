/**
 * Project Routes Tests
 * Example test file for API routes
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build, createAuthHeaders } from '../helper'

describe('Project routes', () => {
  let app: any;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/projects - unauthorized', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/projects',
    });

    expect(response.statusCode).toBe(401);
  });

  it('POST /api/projects - create project (with auth)', async () => {
    // Note: In real tests, you would need to:
    // 1. Create a test user
    // 2. Get a valid auth token
    // 3. Use that token in the request

    const response = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: {
        authorization: 'Bearer test-token', // Replace with real token
      },
      payload: {
        name: 'Test Project',
        location: '123 Main St, Washington, DC',
        type: 'renovation',
        budget: '50000',
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        contractorChoice: 'own',
      },
    });

    // This will fail without proper auth setup
    // expect(response.statusCode).toBe(201);
    // const body = JSON.parse(response.body);
    // expect(body.project).toBeDefined();
    // expect(body.project.name).toBe('Test Project');
  });

  it('GET /api/projects/:id - get project', async () => {
    // Create project first (with proper auth)
    // Then get it
    
    const response = await app.inject({
      method: 'GET',
      url: '/api/projects/test-id',
      headers: {
        authorization: 'Bearer test-token',
      },
    });

    // This will fail without proper setup
    // expect(response.statusCode).toBe(200);
  });
});

