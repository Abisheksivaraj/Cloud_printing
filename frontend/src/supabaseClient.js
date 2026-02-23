import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://msisdqfgefdrhwdgoauw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaXNkcWZnZWZkcmh3ZGdvYXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTg0NDUsImV4cCI6MjA4NzMzNDQ0NX0.gW7Y7byCPqISVwl-1T_9wc5MvtMbTCUqW_4k6YJ_tT8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Edge Function names
export const API_URLS = {
    LOGIN: 'login',
    COMPLETE_PROFILE: 'complete-profile',
};

// Helper to call edge functions using the SDK
export const callEdgeFunction = async (functionName, body) => {
    const { data, error } = await supabase.functions.invoke(functionName, {
        body: body,
    });

    if (error) {
        console.error(`Error calling function ${functionName}:`, error);

        // Try to get a more specific error message from different possible structures
        let errorMessage = error.message || 'Request failed';

        // Handle FunctionsHttpError and other possible error response bodies
        try {
            if (error.context && error.context.json) {
                errorMessage = error.context.json.error || error.context.json.message || errorMessage;
            } else if (error.response) {
                const errorData = await error.response.json().catch(() => ({}));
                errorMessage = errorData.error || errorData.message || errorMessage;
            }
        } catch (e) {
            console.error("Failed to parse error response:", e);
        }

        throw new Error(errorMessage);
    }

    return data;
};
