import React, { useState, useEffect } from "react";
import { Tag } from "lucide-react";
import LabelLibrary from "./components/LabelLibrary";
import { AppHeader } from "./components/HeaderActions";
import LabelDesigner from "./components/LabelDesign";
import Signup from "./components/admin/Signup";
import Login from "./components/admin/Login";
import AdminDashboard from "./components/admin/AdminDashboard";
import PrintHistory from "./components/PrintHistory";
import DeviceManagement from "./components/DeviceManagement";
import AddPrinter from "./components/AddPrinter";
import { useTheme } from "./ThemeContext";
import { callEdgeFunction, API_URLS, normalizeDesign } from "./supabaseClient";

const MM_TO_PX = 3.7795275591;
import Toast from "./components/Toast";


const App = () => {
  const { theme } = useTheme();
  const [labels, setLabels] = useState([]);
  const [currentView, setCurrentView] = useState("signup"); // Default to signup
  const [currentLabel, setCurrentLabel] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }
  const [selectedConnectorId, setSelectedConnectorId] = useState(null);

  useEffect(() => {
    // Check for active session on mount
    const checkSession = async () => {
      // ✅ Handle session detection from URL hash (invites/resets)
      await supabase.auth.getSession();

      const token = sessionStorage.getItem("authToken");
      const refreshToken = sessionStorage.getItem("refreshToken");
      const storedUserData = sessionStorage.getItem("userData");
      let parsedUserData = null;
      if (storedUserData) {
        try {
          parsedUserData = JSON.parse(storedUserData);
          setUserData(parsedUserData);
          setUserRole(parsedUserData.role?.toLowerCase() || 'operator');
        } catch (e) {
          console.error("Failed to parse user data", e);
        }
      }

      // Handle invitation/profile completion route
      const isCompleteProfile = window.location.pathname === "/complete-profile" || window.location.pathname === "/accept-invite";

      if (isCompleteProfile) {
        setCurrentView("login");
        setIsAuthenticated(!!token);
      } else if (token) {
        // Sync session with Supabase client (Await this to prevent race conditions)
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: refreshToken || ""
        });

        if (!sessionError && sessionData?.session) {
          // Update storage with fresh tokens if session was refreshed
          const freshToken = sessionData.session.access_token;
          const freshRefresh = sessionData.session.refresh_token;
          sessionStorage.setItem("authToken", freshToken);
          if (freshRefresh) sessionStorage.setItem("refreshToken", freshRefresh);
          
          setIsAuthenticated(true);
        } else if (sessionError) {
          console.warn("Session restoration failed:", sessionError);
          setIsAuthenticated(false);
          setCurrentView("login");
          sessionStorage.clear();
        } else {
          setIsAuthenticated(true);
        }

        const savedView = sessionStorage.getItem("currentView");
        const isAdmin = parsedUserData?.role?.toLowerCase() === 'admin';

        // Restore saved view if it exists and is valid for the role
        if (savedView && savedView !== "login" && savedView !== "signup" && savedView !== "logout") {
          if (savedView === "admin_dashboard" && !isAdmin) {
            setCurrentView("library");
          } else {
            setCurrentView(savedView);
          }
        } else {
          // Default redirect based on role
          if (isAdmin) {
            setCurrentView("admin_dashboard");
          } else {
            setCurrentView("library");
          }
        }
      } else {
        setIsAuthenticated(false);
        setCurrentView("login");
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  // Helper: get the design_id for API calls (backend always uses design_id)
  const getDesignId = (designObj) => {
    if (!designObj) return null;
    return designObj.design_id ||
      designObj.id ||
      designObj.design?.design_id ||
      designObj.design?.id ||
      designObj.data?.design_id ||
      designObj.data?.id;
  };

  const fetchDesigns = async () => {
    try {
      const data = await callEdgeFunction(API_URLS.GET_DESIGNS, {});
      console.log("fetchDesigns raw data:", data);
      // Handle both array response and { designs: [...] } wrapper
      const designsList = Array.isArray(data) ? data : (data?.designs || data?.data || []);
      const normalized = designsList.map(l => normalizeDesign(l));
      setLabels(normalized);
    } catch (error) {
      console.error("Error fetching designs:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (currentView === "library" || currentView === "print_history")) {
      fetchDesigns();
    }
  }, [currentView, isAuthenticated]);

  // Manage navigation
  const navigateTo = (view, payload = null) => {
    if (view === "logout") {
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("userData");
      sessionStorage.removeItem("companyName");
      sessionStorage.removeItem("currentView");
      setIsAuthenticated(false);
      setUserRole(null);
      setUserData(null);
      setCurrentView("login");
      return;
    }

    // Safety check for admin dashboard
    if (view === "admin_dashboard" && userRole !== 'admin') {
      setCurrentView("library");
      return;
    }

    if (view === "add_printer" && payload) {
      setSelectedConnectorId(payload);
    }

    setCurrentView(view);
    // Only save potentially valid authenticated views
    if (view !== "login" && view !== "signup" && view !== "logout") {
      sessionStorage.setItem("currentView", view);
    }
  };

  const handleSignup = (user) => {
    console.log("Signup successful:", user);
    setIsAuthenticated(true);
    setUserData(user);
    setUserRole(user.role?.toLowerCase() || 'admin'); // Signup usually creates an admin unless it's a profile completion
    setCurrentView(user.role?.toLowerCase() === 'admin' ? "admin_dashboard" : "library");
  };

  const handleLogin = (user) => {
    console.log("Login successful:", user);
    setIsAuthenticated(true);
    setUserData(user);
    setUserRole(user.role?.toLowerCase() || 'operator');
    setCurrentView(user.role?.toLowerCase() === 'admin' ? "admin_dashboard" : "library");
  };

  // Note: fetchDesigns above (line 73) already handles library + print_history fetching.
  // The duplicate useEffect has been removed to avoid overwriting labels with non-array data.

  // Central normalization moved to supabaseClient.js
  const fetchFullDesign = async (label) => {
    const designId = getDesignId(label);
    if (!designId) return label;
    try {
      const fullDesign = await callEdgeFunction(API_URLS.GET_DESIGN, { design_id: designId });
      return normalizeDesign(fullDesign);
    } catch (error) {
      console.error("Error fetching full design:", error);
      return normalizeDesign(label);
    }
  };

  const handleCreateLabel = (newLabel) => {
    if (userRole === 'viewer') return;

    // The label is already created via API in the modal
    const normalized = normalizeDesign(newLabel);
    setLabels(prev => [...prev, normalized]);
    setCurrentLabel(normalized);
    setCurrentView("designer");
  };

  const handleEditLabel = async (label) => {
    if (userRole === 'viewer') {
      setCurrentLabel(normalizeDesign(label));
      setCurrentView("designer");
      return;
    }

    const designId = getDesignId(label);
    try {
      // Fetch the full design details (including elements)
      const fullDesign = await callEdgeFunction(API_URLS.GET_DESIGN, { design_id: designId });
      const normalizedFull = normalizeDesign(fullDesign);
      const normalizedOriginal = normalizeDesign(label);
      setCurrentLabel({ ...normalizedOriginal, ...normalizedFull });
    } catch (error) {
      console.error("Error fetching design details:", error);
      setCurrentLabel(normalizeDesign(label));
    }

    setCurrentView("designer");
  };

  const handleDeleteLabel = async (labelId) => {
    if (userRole === 'viewer') return;
    const targetLabel = labels.find(l => l.id === labelId || l.design_id === labelId);
    const actualDesignId = getDesignId(targetLabel) || labelId;
    try {
      await callEdgeFunction(API_URLS.DELETE_DESIGN, {
        design_id: actualDesignId,
        version_major: targetLabel?.version_major || 0,
        version_minor: targetLabel?.version_minor || 1
      });
      setLabels(labels.map((l) => getDesignId(l) === actualDesignId ? { ...l, deleted_at: new Date().toISOString() } : l));
      setToast({ message: "Label moved to Trash", type: "success" });
    } catch (error) {
      console.error("Failed to delete label:", error);
      setToast({ message: `Delete failed: ${error.message}`, type: "error" });
    }
  };

  const handleUpdateStatus = async (labelId, status) => {
    if (userRole === 'viewer') return;
    const targetLabel = labels.find(l => l.id === labelId || l.design_id === labelId);
    const actualDesignId = getDesignId(targetLabel) || labelId;
    try {
      let endpoint;
      let successMsg;

      switch (status) {
        case 'archived': endpoint = API_URLS.ARCHIVE_DESIGN; successMsg = "Label archived"; break;
        case 'restored':
        case 'draft': endpoint = API_URLS.RESTORE_DESIGN; successMsg = "Label restored"; break;
        default: endpoint = API_URLS.UPDATE_DESIGN; successMsg = "Status updated";
      }

      console.log("handleUpdateStatus — targets:", { actualDesignId, version_major: targetLabel?.version_major, version_minor: targetLabel?.version_minor });

      const result = await callEdgeFunction(endpoint, {
        design_id: actualDesignId,
        version_major: targetLabel?.version_major !== undefined ? targetLabel.version_major : 0,
        version_minor: targetLabel?.version_minor !== undefined ? targetLabel.version_minor : 1
      });

      const updatedFromResult = normalizeDesign(result);

      // Update local state: clear deleted_at on restoration, update status
      // If status is 'restored', we usually move it back to 'draft'
      const newStatus = status === 'restored' ? 'draft' : status;

      setLabels(labels.map(l =>
        getDesignId(l) === actualDesignId
          ? {
            ...l,
            ...(updatedFromResult || {}),
            status: newStatus,
            deleted_at: status === 'restored' ? null : l.deleted_at
          }
          : l
      ));
      setToast({ message: successMsg, type: "success" });
    } catch (error) {
      console.error("Failed to update status:", error);
      setToast({ message: `Failed to update status: ${error.message}`, type: "error" });
    }
  };

  const handleSaveLabel = async (labelData) => {
    if (userRole === 'viewer') return;
    const designId = getDesignId(currentLabel);

    if (!designId) {
      setToast({ message: "Save failed: design has no ID", type: "error" });
      return;
    }

    try {
      const isPublishing = labelData.status === 'published';

      // 1. Update design content (dimensions, name, etc.)
      const updatePayload = {
        design_id: designId,
        version_major: currentLabel.version_major || 0,
        version_minor: currentLabel.version_minor || 1,
        name: labelData.name || currentLabel.name,
        description: labelData.description || currentLabel.description,
        dimensions: labelData.labelSize || currentLabel.dimensions || currentLabel.labelSize,
        canvas_width: Math.round((labelData.labelSize?.width || currentLabel.dimensions?.width || currentLabel.labelSize?.width || 100) * MM_TO_PX),
        status: currentLabel.status, // Keep current status for update
      };

      const savedResult = await callEdgeFunction(API_URLS.UPDATE_DESIGN, updatePayload);
      let updatedDesign = normalizeDesign(savedResult);

      // 2. If publishing, call the publish endpoint
      if (isPublishing) {
        const publishResult = await callEdgeFunction(API_URLS.PUBLISH_DESIGN, {
          design_id: designId,
          version_major: updatedDesign.version_major !== undefined ? updatedDesign.version_major : 0,
          version_minor: updatedDesign.version_minor !== undefined ? updatedDesign.version_minor : 1
        });
        // Important: Publishing might return a new version (e.g., 1.0)
        const publishedDesign = normalizeDesign(publishResult);
        if (publishedDesign) updatedDesign = { ...updatedDesign, ...publishedDesign };
      }

      setToast({
        message: isPublishing ? "Label published successfully!" : "Label saved successfully!",
        type: "success"
      });

      // Update local labels list
      const updatedLabels = labels.map((label) =>
        getDesignId(label) === designId
          ? {
            ...label,
            ...updatedDesign,
            status: isPublishing ? 'published' : (updatedDesign.status || label.status),
            lastModified: new Date().toLocaleString(),
          }
          : label
      );
      setLabels(updatedLabels);

      // Navigate back after successful save
      handleBackToLibrary();
    } catch (error) {
      console.error("Failed to save label:", error);
      setToast({ message: `Save failed: ${error.message}`, type: "error" });
    }
  };

  const handleBackToLibrary = () => {
    setCurrentView("library");
    setCurrentLabel(null);
  };

  // ✅ Contextual Header 
  // We might want to show different headers based on authentication
  const showMainApp = isAuthenticated && (currentView === "library" || currentView === "designer");

  return (
    <div className="min-h-screen w-full transition-colors duration-300 flex flex-col bg-white">
      {/* Navigation / Header - Only show for main app functionality */}
      {(isAuthenticated || currentView === "library" || currentView === "designer" || currentView === "admin_dashboard") && !isLoading && (
        <AppHeader
          onNavigate={navigateTo}
          currentView={currentView}
          userRole={userRole}
          userData={userData}
        />
      )}

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#39A3DD]"></div>
          </div>
        ) : (
          <>
            {currentView === "signup" && (
              <Signup
                onSignup={handleSignup}
                onSwitchToLogin={() => setCurrentView("login")}
              />
            )}

            {currentView === "login" && (
              <Login
                onLogin={handleLogin}
                onSwitchToSignup={() => setCurrentView("signup")}
              />
            )}

            {currentView === "admin_dashboard" && (
              <AdminDashboard userRole={userRole} />
            )}

            {currentView === "library" && (
              <LabelLibrary
                labels={Array.isArray(labels) ? labels : []}
                userRole={userRole}
                onCreateLabel={handleCreateLabel}
                onEditLabel={handleEditLabel}
                onDeleteLabel={handleDeleteLabel}
                onUpdateStatus={handleUpdateStatus}
                onNavigate={navigateTo}
                fetchFullDesign={fetchFullDesign}
              />
            )}

            {currentView === "designer" && (
              <LabelDesigner
                label={currentLabel}
                userRole={userRole}
                onSave={handleSaveLabel}
                onBack={handleBackToLibrary}
                onCreateLabel={handleCreateLabel}
              />
            )}
            {currentView === "print_history" && (
              <PrintHistory labels={labels} fetchFullDesign={fetchFullDesign} />
            )}
            {currentView === "device_management" && (
              <DeviceManagement onNavigate={navigateTo} />
            )}
            {currentView === "add_printer" && (
              <AddPrinter 
                connectorId={selectedConnectorId}
                onBack={() => navigateTo('device_management')} 
              />
            )}
          </>
        )}
      </main>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default App;
