/**
 * API Key Admin Routes - Individual Key Operations
 */

import {NextRequest, NextResponse} from 'next/server';
import {createServerClient} from '@/lib/supabase/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// DELETE /api/admin/api-keys/[id] - Revoke API key
export async function DELETE(
  request: NextRequest,
  {params}: {params: {id: string}}
) {
  try {
    const {id} = params;

    // Get Supabase session token for authentication
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || '';

    const response = await fetch(`${API_BASE_URL}/api/v1/api-keys/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.statusText}`);
    }

    return NextResponse.json({success: true}, {status: 204});
  } catch (error: any) {
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
