import React, { useState, useEffect } from "react";
import { Tag } from "lucide-react";
import LabelLibrary from "./components/LabelLibrary";
import { AppHeader } from "./components/HeaderActions";
import LabelDesigner from "./components/LabelDesign";
import Signup from "./components/admin/Signup";
import Login from "./components/admin/Login";
import AdminDashboard from "./components/admin/AdminDashboard";
import PrintHistory from "./components/PrintHistory";
import { useTheme } from "./ThemeContext";
import { supabase } from "./supabaseClient";


const App = () => {
  const { theme } = useTheme();
  const [labels, setLabels] = useState([]);
  const [currentView, setCurrentView] = useState("signup"); // Default to signup
  const [currentLabel, setCurrentLabel] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Check for active session on mount
    const checkSession = async () => {
      // ✅ Handle session detection from URL hash (invites/resets)
      await supabase.auth.getSession();

      const token = sessionStorage.getItem("authToken");
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
        // Sync session with Supabase client
        supabase.auth.setSession({
          access_token: token,
          refresh_token: "" // We don't have this in storage yet, but access_token is enough for many cases
        });
        setIsAuthenticated(true);

        // Redirect based on role
        if (parsedUserData?.role?.toLowerCase() === 'admin') {
          setCurrentView("admin_dashboard");
        } else {
          setCurrentView("library");
        }
      } else {
        setIsAuthenticated(false);
        setCurrentView("login");
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  // Manage navigation
  const navigateTo = (view) => {
    if (view === "logout") {
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("userData");
      sessionStorage.removeItem("companyName");
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

    setCurrentView(view);
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

  const handleCreateLabel = (labelData) => {
    if (userRole === 'viewer') return;
    const newLabel = {
      id: `label_${Date.now()}`,
      ...labelData,
      createdAt: new Date().toLocaleString(),
      lastModified: new Date().toLocaleString(),
    };
    setLabels([...labels, newLabel]);
    setCurrentLabel(newLabel);
    setCurrentView("designer");
  };

  const handleEditLabel = (label) => {
    if (userRole === 'viewer') {
      setCurrentLabel(label);
      setCurrentView("designer"); // Designer should handle read-only mode or we just show preview
      return;
    }
    setCurrentLabel(label);
    setCurrentView("designer");
  };

  const handleDeleteLabel = (labelId) => {
    if (userRole === 'viewer') return;
    setLabels(labels.filter((label) => label.id !== labelId));
  };

  const handleSaveLabel = (labelData) => {
    if (userRole === 'viewer') return;
    const updatedLabels = labels.map((label) =>
      label.id === currentLabel.id
        ? {
          ...label,
          ...labelData,
          lastModified: new Date().toLocaleString(),
        }
        : label,
    );
    setLabels(updatedLabels);
    setCurrentLabel({ ...currentLabel, ...labelData });
  };

  const handleBackToLibrary = () => {
    setCurrentView("library");
    setCurrentLabel(null);
  };

  // ✅ Contextual Header 
  // We might want to show different headers based on authentication
  const showMainApp = isAuthenticated && (currentView === "library" || currentView === "designer");

  return (
    <div className="h-screen w-screen transition-colors duration-300 flex flex-col overflow-hidden bg-white">
      {/* Navigation / Header - Only show for main app functionality */}
      {(isAuthenticated || currentView === "library" || currentView === "designer" || currentView === "admin_dashboard") && !isLoading && (
        <AppHeader
          onNavigate={navigateTo}
          currentView={currentView}
          userRole={userRole}
          userData={userData}
        />
      )}

      <main className="flex-1">
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
                labels={labels}
                userRole={userRole}
                onCreateLabel={handleCreateLabel}
                onEditLabel={handleEditLabel}
                onDeleteLabel={handleDeleteLabel}
              />
            )}

            {currentView === "designer" && (
              <LabelDesigner
                label={currentLabel}
                userRole={userRole}
                onSave={handleSaveLabel}
                onBack={handleBackToLibrary}
              />
            )}
            {currentView === "print_history" && (
              <PrintHistory labels={labels} />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
