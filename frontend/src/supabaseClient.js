import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://msisdqfgefdrhwdgoauw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaXNkcWZnZWZkcmh3ZGdvYXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTg0NDUsImV4cCI6MjA4NzMzNDQ0NX0.gW7Y7byCPqISVwl-1T_9wc5MvtMbTCUqW_4k6YJ_tT8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Edge Function API endpoints
export const API_URLS = {
    LOGIN: `${supabaseUrl}/functions/v1/login`,
    COMPLETE_PROFILE: `${supabaseUrl}/functions/v1/complete-profile`,
};

// Helper to call edge functions with auth header
export const callEdgeFunction = async (url, body) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'apikey': supabaseAnonKey,
        },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
};
