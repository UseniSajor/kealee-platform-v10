/**
 * Client-safe Supabase instance.
 *
 * This file intentionally does NOT import any server-side modules (Prisma, etc.)
 * so it can be safely used in 'use client' React components.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
