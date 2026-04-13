import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANONYMOUS_KEY;

// Check if environment variables are defined
if (!SUPABASE_URL) {
  console.error('VITE_SUPABASE_URL is undefined. Please check your environment variables.');
}
if (!SUPABASE_PUBLISHABLE_KEY) {
  console.error('VITE_SUPABASE_ANONYMOUS_KEY is undefined. Please check your environment variables.');
}

// Debug environment variables
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key exists:', !!SUPABASE_PUBLISHABLE_KEY);

export const supabase = createClient<Database>(SUPABASE_URL || '', SUPABASE_PUBLISHABLE_KEY || '');