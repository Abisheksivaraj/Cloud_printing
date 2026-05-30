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
    PRINTER_STATUS: 'printer-status',

    // Designs
    CREATE_DESIGN: 'create-design',
    GET_DESIGNS: 'get-designs',
    GET_DESIGN: 'get-design',
    UPDATE_DESIGN: 'update-design',
    PUBLISH_DESIGN: 'publish-design',
    DRAFT_DESIGN: 'draft-design',
    ARCHIVE_DESIGN: 'archive-design',
    UNARCHIVE_DESIGN: 'unarchive-design',
    DELETE_DESIGN: 'delete-design',
    RESTORE_DESIGN: 'restore-design',

    // Bulk Import / Print
    UPLOAD_IMPORT: 'upload-import',
    GET_IMPORT_JOBS: 'get-import-jobs',
    CONFIRM_IMPORT: 'confirm-import',

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
export const callEdgeFunction = async (functionName, body, options = {}, retryCount = 0) => {
    // Skip Authorization header ONLY for public/onboarding endpoints
    const authEndpoints = [API_URLS.LOGIN, API_URLS.COMPLETE_PROFILE, API_URLS.GET_INVITATION];

    console.log(`Calling Edge Function: ${functionName} (Retry: ${retryCount})`);
    
    try {
        let { data: { session } } = await supabase.auth.getSession();
        
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

        const token = session?.access_token || sessionStorage.getItem("authToken");

        if (!token && !authEndpoints.includes(functionName)) {
            console.warn(`⚠️ No token found for ${functionName}. This will likely result in a 401.`);
        } else if (token) {
            console.log(`🔑 Token present for ${functionName} (${token.substring(0, 10)}...)`);
        }

        // upload-import is routed through connector-host (proxied via Vite locally to avoid CORS)
        let url;
        if (functionName === API_URLS.UPLOAD_IMPORT) {
            url = import.meta.env.PROD 
                ? 'https://connector-host.onrender.com/api/imports/upload'
                : '/connector-api/api/imports/upload';
        } else {
            url = `${supabaseUrl}functions/v1/${functionName}?apikey=${supabaseAnonKey}`;
        }

        // Append query params if provided (e.g. for GET-style edge functions)
        if (options.queryParams) {
            const params = new URLSearchParams(options.queryParams).toString();
            url += (url.includes('?') ? '&' : '?') + params;
        }
        
        const isFormData = body instanceof FormData;
        
        const fetchHeaders = {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...options.headers
        };

        if (token && !authEndpoints.includes(functionName) && !fetchHeaders['Authorization']) {
            fetchHeaders['Authorization'] = `Bearer ${token.trim()}`;
        }

        const response = await fetch(url, {
            method: options.method || 'POST',
            headers: fetchHeaders,
            body: isFormData ? body : (body ? JSON.stringify(body) : undefined)
        });

        if (!response.ok) {
            // Handle 401 Unauthorized
            if (response.status === 401 && retryCount < 2) {
                console.warn(`🔄 401 Detected for ${functionName}. Attempting recovery...`);
                
                // Retry 1: Try refreshing the user session
                if (retryCount === 0) {
                    console.log("👉 Attempting session refresh...");
                    const { data: refreshData } = await supabase.auth.refreshSession();
                    if (refreshData?.session) {
                        sessionStorage.setItem("authToken", refreshData.session.access_token);
                        return callEdgeFunction(functionName, body, options, retryCount + 1);
                    }
                }
                
                // Retry 2: Try using the project's Anon Key as a fallback
                // Some functions might be configured to accept the project key instead of user JWT
                console.log("👉 Attempting fallback to project Anon Key...");
                const fallbackHeaders = { ...options.headers, 'Authorization': `Bearer ${supabaseAnonKey}` };
                return callEdgeFunction(functionName, body, { ...options, headers: fallbackHeaders }, retryCount + 1);
            }

            const responseText = await response.text();
            console.error(`🔴 Server responded with ${response.status} for ${functionName}:`, responseText);
            
            let errorMessage = `Request failed (${response.status})`;
            try {
                const parsed = JSON.parse(responseText);
                errorMessage = parsed.error || parsed.message || parsed.msg || parsed.details || errorMessage;
            } catch (e) {
                errorMessage = responseText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        return await response.json();

    } catch (error) {
        console.error(`❌ Error in callEdgeFunction for ${functionName}:`, error);
        throw error;
    }
};

/* ==========================================================================
   UNIT CONVERSION UTILITIES (96 DPI assumption)
   ========================================================================== */

export const DPI = 96;
export const MM_TO_PX = DPI / 25.4;
export const CM_TO_PX_RATIO = DPI / 2.54;
export const INCH_TO_PX_RATIO = DPI;

export const convertToPx = (value, unit) => {
    if (value === undefined || value === null) return value;
    switch (unit) {
        case 'mm': return value * MM_TO_PX;
        case 'cm': return value * CM_TO_PX_RATIO;
        case 'inch': return value * INCH_TO_PX_RATIO;
        default: return value; // Default to px or unknown
    }
};

export const convertFromPx = (px, unit) => {
    if (px === undefined || px === null) return px;
    switch (unit) {
        case 'mm': return px / MM_TO_PX;
        case 'cm': return px / CM_TO_PX_RATIO;
        case 'inch': return px / INCH_TO_PX_RATIO;
        default: return px;
    }
};

export const mapPayloadToElement = (payload) => {
    if (!payload) return null;
    const props = payload.properties || {};
    return {
        ...props, // Load extra style properties from JSON field
        id: payload.id,
        type: props.actualType || payload.element_type || payload.type,
        x: payload.position_x !== undefined ? payload.position_x : (props.x !== undefined ? props.x : payload.x),
        y: payload.position_y !== undefined ? payload.position_y : (props.y !== undefined ? props.y : payload.y),
        width: payload.width !== undefined ? payload.width : props.width,
        height: payload.height !== undefined ? payload.height : props.height,
        fontSize: props.fontSize !== undefined ? props.fontSize : payload.fontSize,
        borderWidth: props.borderWidth !== undefined ? props.borderWidth : payload.borderWidth,
        borderRadius: props.borderRadius !== undefined ? props.borderRadius : payload.borderRadius,
        content: payload.static_content !== undefined ? payload.static_content : (payload.content || props.content),
        zIndex: payload.sort_order !== undefined ? payload.sort_order : (payload.zIndex || props.zIndex || props.sort_order)
    };
};

export const normalizeDesign = (design) => {
    if (!design) return design;

    // Flatten nested design/data wrappers
    const base = design.design || design.data || design;
    const finalId = base.design_id || base.id || design.design_id || design.id;

    // Normalize dimensions to standard labelSize object
    let labelSize = base.labelSize || base.dimensions ||
        (base.width && base.height ? { width: base.width, height: base.height, unit: base.unit || 'mm' } : null);

    if (labelSize) {
        labelSize = {
            ...labelSize,
            width: Number(labelSize.width),
            height: Number(labelSize.height),
            unit: labelSize.unit === 'in' ? 'inch' : (labelSize.unit || 'mm')
        };
    } else {
        labelSize = { width: 100, height: 80, unit: 'mm' };
    }

    const currentUnit = labelSize.unit;

    // Normalize and map elements array
    let elements = base.elements || design.elements || [];
    if (Array.isArray(elements)) {
        elements = elements.map(el => {
            const mapped = mapPayloadToElement(el);
            
            const converted = {
                ...mapped,
                x: convertToPx(mapped.x, currentUnit),
                y: convertToPx(mapped.y, currentUnit),
                width: convertToPx(mapped.width, currentUnit),
                height: convertToPx(mapped.height, currentUnit),
                fontSize: convertToPx(mapped.fontSize, currentUnit),
                borderWidth: convertToPx(mapped.borderWidth, currentUnit),
                borderRadius: convertToPx(mapped.borderRadius, currentUnit),
            };

            // Handle special cases like line points if they exist in properties
            if (mapped.x1 !== undefined) converted.x1 = convertToPx(mapped.x1, currentUnit);
            if (mapped.y1 !== undefined) converted.y1 = convertToPx(mapped.y1, currentUnit);
            if (mapped.x2 !== undefined) converted.x2 = convertToPx(mapped.x2, currentUnit);
            if (mapped.y2 !== undefined) converted.y2 = convertToPx(mapped.y2, currentUnit);

            return converted;
        });
    }

    return {
        ...design,
        ...base,
        id: finalId,
        design_id: finalId,
        labelSize,
        elements
    };
};