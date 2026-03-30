import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://imxirmbzqcmacqukzvar.supabase.co/';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlteGlybWJ6cWNtYWNxdWt6dmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjcxOTIsImV4cCI6MjA4NzUwMzE5Mn0.geyjZ8UqKIJ695ktI6HyqItHx40Pj-Sd8ATEfah3H9w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        detectSessionInUrl: true,
        persistSession: false, // Don't persist session in localStorage
        autoRefreshToken: true,
        flowType: "pkce",
    }
});

// Edge Function names
export const API_URLS = {

    // Logins
    LOGIN: 'login',
    COMPLETE_PROFILE: 'complete-registration',
    GET_INVITATION: 'get-invitation',
    USER_INVITE: 'invite-user',

    // Jobs
    CREATE_JOB: 'create-job',
    LIST_JOBS: 'list-jobs',
    CANCEL_JOB: 'cancel-job',
    CONNECTOR_AUTH: 'connector-auth',
    POLL_JOBS: 'poll-jobs',
    UPDATE_JOB_STATUS: 'update-job-status',

    // Connectors / Devices
    CREATE_CONNECTOR: 'create-connector',
    LIST_CONNECTORS: 'list-connectors',
    DELETE_CONNECTOR: 'delete-connector',
    RESET_CONNECTOR: 'reset-connector-key',
    ADD_PRINTER: 'add-printer',
    LIST_PRINTERS: 'list-printers',
    DELETE_PRINTER: 'delete-printer',

    // Designs
    CREATE_DESIGN: 'create-design',
    GET_DESIGNS: 'get-designs',
    GET_DESIGN: 'get-design',
    UPDATE_DESIGN: 'update-design',
    PUBLISH_DESIGN: 'publish-design',
    ARCHIVE_DESIGN: 'archive-design',
    DELETE_DESIGN: 'delete-design',
    RESTORE_DESIGN: 'restore-design',

    // Elements
    ADD_ELEMENT: 'add-element',
    UPDATE_ELEMENT: 'update-element',
    DELETE_ELEMENT: 'delete-element',
    GET_ELEMENTS: 'get-elements',

    // Users
    LIST_USERS: 'list-users',
    DELETE_USER: 'delete-user',
    STATUS: 'toggle-user-status'
};

// Helper to call edge functions using the SDK
export const callEdgeFunction = async (functionName, body, retryCount = 0) => {
    // 1. Try to get token from current active session (source of truth)
    let { data: { session } } = await supabase.auth.getSession();
    
    // 2. If session is missing but we have a refresh token, try restoration
    if (!session) {
        const storedRefresh = sessionStorage.getItem("refreshToken");
        const storedAuth = sessionStorage.getItem("authToken");
        if (storedRefresh && storedAuth) {
            const { data } = await supabase.auth.setSession({
                access_token: storedAuth,
                refresh_token: storedRefresh
            });
            session = data.session;
        }
    }

    let token = session?.access_token || sessionStorage.getItem("authToken");

    // Skip Authorization header ONLY for public/onboarding endpoints
    const authEndpoints = [API_URLS.LOGIN, API_URLS.COMPLETE_PROFILE, API_URLS.GET_INVITATION];
    const headers = {};
    if (token && !authEndpoints.includes(functionName)) {
        headers.Authorization = `Bearer ${token.trim()}`;
    }

    console.log(`Calling Edge Function: ${functionName} (Retry: ${retryCount})`);
    const { data, error } = await supabase.functions.invoke(functionName, {
        body: body,
        headers: headers,
    });

    if (error) {
        // Handle 401 Unauthorized with one retry after a session refresh
        const isUnauthorized = error.message?.includes("401") || 
                             (error.context && error.context.status === 401);

        if (isUnauthorized && retryCount < 1) {
            console.warn(`401 Detected for ${functionName}. Refreshing session and retrying...`);
            const { data: refreshData } = await supabase.auth.refreshSession();
            if (refreshData?.session) {
                sessionStorage.setItem("authToken", refreshData.session.access_token);
                if (refreshData.session.refresh_token) {
                    sessionStorage.setItem("refreshToken", refreshData.session.refresh_token);
                }
                // Small delay to let client state settle
                await new Promise(resolve => setTimeout(resolve, 300));
                return callEdgeFunction(functionName, body, retryCount + 1);
            }
        }

        console.error(`Error calling function ${functionName}:`, error);

        let errorMessage = 'Request failed';

        if (error.context) {
            try {
                const response = error.context;
                const text = await response.text();
                try {
                    const parsed = JSON.parse(text);
                    errorMessage = parsed.error || parsed.message || parsed.msg || parsed.error_description || errorMessage;
                } catch (e) {
                    errorMessage = text || errorMessage;
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

/* ==========================================================================
   DESIGN NORMALIZATION & MAPPING UTILITIES
   Ensures consistent property names across components regardless of backend 
   naming conventions (e.g., position_x vs x).
   ========================================================================== */

export const mapPayloadToElement = (payload) => {
    if (!payload) return null;
    return {
        ...(payload.properties || {}), // Load extra style properties from JSON field
        id: payload.id,
        type: payload.element_type || payload.type,
        x: payload.position_x !== undefined ? payload.position_x : payload.x,
        y: payload.position_y !== undefined ? payload.position_y : payload.y,
        width: payload.width,
        height: payload.height,
        content: payload.static_content !== undefined ? payload.static_content : payload.content,
        zIndex: payload.sort_order !== undefined ? payload.sort_order : payload.zIndex
    };
};

export const normalizeDesign = (design) => {
    if (!design) return design;

    const MM_TO_PX = 3.7795275591;

    // Flatten nested design/data wrappers if present from API response
    const base = design.design || design.data || design;
    const finalId = base.design_id || base.id || design.design_id || design.id;

    // Normalize dimensions to standard labelSize object
    let labelSize = base.labelSize || base.dimensions ||
        (base.width && base.height ? { width: base.width, height: base.height, unit: base.unit || 'mm' } : null);

    if (labelSize) {
        labelSize = {
            ...labelSize,
            width: Math.round(labelSize.width),
            height: Math.round(labelSize.height)
        };
    }

    // Normalize and map elements array
    let elements = base.elements || design.elements || [];
    if (Array.isArray(elements)) {
        elements = elements.map(el => {
            const mapped = mapPayloadToElement(el);
            // MIGRATION: If canvas_width is missing, this is likely an old MM-based design.
            // Check both top-level and settings for canvas_width
            const hasCanvasWidth = base.canvas_width || design.canvas_width || base.settings?.canvas_width || design.settings?.canvas_width;
            
            if (!hasCanvasWidth) {
                const thresholdX = (labelSize?.width || 100) * 1.5;
                const isLikelyMm = mapped.x < thresholdX;
                
                if (isLikelyMm) {
                    return {
                        ...mapped,
                        x: mapped.x * MM_TO_PX,
                        y: mapped.y * MM_TO_PX,
                        width: mapped.width * MM_TO_PX,
                        height: mapped.height * MM_TO_PX,
                        fontSize: (mapped.fontSize || 14) * (MM_TO_PX / 3.784),
                        borderWidth: (mapped.borderWidth || 0) * MM_TO_PX,
                        borderRadius: (mapped.borderRadius || 0) * MM_TO_PX,
                        letterSpacing: (mapped.letterSpacing || 0) * MM_TO_PX,
                    };
                }
            }
            return mapped;
        });
    }

    return {
        ...design,
        ...base,
        id: finalId,
        design_id: finalId,
        labelSize: labelSize || { width: 100, height: 80 },
        elements
    };
};
