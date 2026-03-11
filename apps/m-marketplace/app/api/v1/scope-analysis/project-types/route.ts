import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/v1/scope-analysis/project-types`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Failed to fetch project types from backend:', error);
  }

  // Fallback: return default project types if backend is unavailable
  return NextResponse.json([
    { id: 'kitchen_renovation', label: 'Kitchen Renovation' },
    { id: 'bathroom_remodel', label: 'Bathroom Remodel' },
    { id: 'basement_finishing', label: 'Basement Finishing' },
    { id: 'room_addition', label: 'Room Addition' },
    { id: 'whole_house_renovation', label: 'Whole House Renovation' },
    { id: 'deck_patio', label: 'Deck / Patio' },
    { id: 'roofing', label: 'Roofing' },
    { id: 'siding_exterior', label: 'Siding / Exterior' },
    { id: 'new_construction', label: 'New Construction' },
    { id: 'commercial_buildout', label: 'Commercial Buildout' },
  ]);
}
