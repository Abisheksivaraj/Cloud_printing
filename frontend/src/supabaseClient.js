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

        let errorMessage = 'Request failed';

        // Supabase FunctionsHttpError usually has the message in the error object itself,
        // or we can try to extract from the response if it's available.
        if (error.context && error.context.json) {
            errorMessage = error.context.json.error || error.context.json.message || errorMessage;
        } else if (error.message && !error.message.includes("non-2xx")) {
            errorMessage = error.message;
        }

        throw new Error(errorMessage);
    }

    return data;
};
