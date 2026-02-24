import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://imxirmbzqcmacqukzvar.supabase.co/';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlteGlybWJ6cWNtYWNxdWt6dmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjcxOTIsImV4cCI6MjA4NzUwMzE5Mn0.geyjZ8UqKIJ695ktI6HyqItHx40Pj-Sd8ATEfah3H9w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        flowType: "pkce",
    }
});

// Edge Function names
export const API_URLS = {
    LOGIN: 'login',
    COMPLETE_PROFILE: 'complete-registration',
};

// Helper to call edge functions using the SDK
export const callEdgeFunction = async (functionName, body) => {
    // 1. Try to get token from current active session (source of truth)
    const { data: { session } } = await supabase.auth.getSession();
    let token = session?.access_token;

    // 2. Fallback to localStorage if no session
    if (!token) {
        token = localStorage.getItem("authToken");
    }

    // Skip Authorization header for login endpoint if no token is available
    const headers = {};
    if (token && functionName !== API_URLS.LOGIN) {
        headers.Authorization = `Bearer ${token}`;
    }

    const { data, error } = await supabase.functions.invoke(functionName, {
        body: body,
        headers: headers,
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
