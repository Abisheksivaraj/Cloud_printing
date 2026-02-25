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
    GET_INVITATION: 'get-invitation',
    USER_INVITE: 'invite-user'
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

    // Skip Authorization header for auth-related endpoints if no session is active 
    // or to avoid sending stale tokens from localStorage during signup/login
    const authEndpoints = [API_URLS.LOGIN, API_URLS.COMPLETE_PROFILE, API_URLS.GET_INVITATION, API_URLS.USER_INVITE];
    const headers = {};
    if (token && !authEndpoints.includes(functionName)) {
        headers.Authorization = `Bearer ${token}`;
    }

    console.log(`Calling Edge Function: ${functionName}`, body);
    const { data, error } = await supabase.functions.invoke(functionName, {
        body: body,
        headers: headers,
    });

    if (error) {
        console.error(`Error calling function ${functionName}:`, error);

        let errorMessage = 'Request failed';

        // Supabase FunctionsHttpError usually includes context
        if (error.context) {
            try {
                // Try to get response text/json if available
                const response = error.context;
                if (response.json) {
                    errorMessage = response.json.error || response.json.message || response.json.msg || errorMessage;
                } else if (response.text) {
                    const text = await response.text();
                    try {
                        const parsed = JSON.parse(text);
                        errorMessage = parsed.error || parsed.message || parsed.msg || errorMessage;
                    } catch (e) {
                        errorMessage = text || errorMessage;
                    }
                }
            } catch (e) {
                console.error("Error parsing error response:", e);
            }
        } else if (error.message && !error.message.includes("non-2xx")) {
            errorMessage = error.message;
        }

        console.error(`Detailed error for ${functionName}:`, errorMessage);
        throw new Error(errorMessage);
    }

    return data;
};
