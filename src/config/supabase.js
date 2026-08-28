const SUPABASE_URL = 'https://ziydynikerwlnkxfkpih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppeWR5bmlrZXJ3bG5reGZrcGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MDY1NTgsImV4cCI6MjEwMzI4MjU1OH0.5XXxggcK7oTwtfxlhQrbwwPv1Pc5GKfO84vZ5GVRHMY';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getCurrentUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch {
        return null;
    }
}

export async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data;
    } catch {
        return null;
    }
}