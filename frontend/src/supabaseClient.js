import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://msisdqfgefdrhwdgoauw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaXNkcWZnZWZkcmh3ZGdvYXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTg0NDUsImV4cCI6MjA4NzMzNDQ0NX0.gW7Y7byCPqISVwl-1T_9wc5MvtMbTCUqW_4k6YJ_tT8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Edge Function names
export const API_URLS = {
    LOGIN: '/functions/v1/login',
    COMPLETE_PROFILE: '/functions/v1/complete-profile',
};

// Helper to call edge functions using the SDK
export const callEdgeFunction = async (functionName, body) => {
    const { data, error } = await supabase.functions.invoke(functionName, {
        body: body,
    });

    if (error) {
        console.error(`Error calling function ${functionName}:`, error);
        throw new Error(error.message || 'Request failed');
    }

    return data;
};
