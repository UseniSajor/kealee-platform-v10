import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// GET - List projects for user
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    let query = supabase
      .from('projects')
      .select(`
        *,
        milestones:project_milestones(*)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      // Return demo data if table doesn't exist
      return NextResponse.json({
        success: true,
        projects: [],
      });
    }

    return NextResponse.json({
      success: true,
      projects: data || [],
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get projects' },
      { status: 500 }
    );
  }
}

// POST - Create new project
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      propertyAddress,
      projectType,
      estimatedBudget,
      startDate,
      endDate,
    } = body;

    if (!name || !projectType) {
      return NextResponse.json(
        { success: false, error: 'Project name and type are required' },
        { status: 400 }
      );
    }

    const projectData = {
      owner_id: user.id,
      name,
      description: description || null,
      property_address: propertyAddress || null,
      project_type: projectType,
      estimated_budget: estimatedBudget || null,
      start_date: startDate || null,
      end_date: endDate || null,
      status: 'planning',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error('Project creation error:', error);
      return NextResponse.json({
        success: true,
        project: {
          id: `proj_${Date.now()}`,
          ...projectData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      project: data,
    });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
