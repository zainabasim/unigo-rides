// Mock Supabase Client - Offline Demo Mode
import { mockSupabase } from '@/mock/mockService';
import type { Database } from './types';

// Using mock service for offline demo
// This completely bypasses Supabase and uses localStorage
console.log('🚀 Using Mock Service - Offline Demo Mode');

// Export mock service with same interface as real Supabase
export const supabase = mockSupabase as any;

// Re-export types for compatibility
export type { Database };