import React, { useState, useEffect } from "react";
import { Tag } from "lucide-react";
import LabelLibrary from "./components/LabelLibrary";
import { AppHeader } from "./components/HeaderActions";
import LabelDesigner from "./components/LabelDesign";
import Signup from "./components/admin/Signup";
import Login from "./components/admin/Login";
import AdminDashboard from "./components/admin/AdminDashboard";
import { useTheme } from "./ThemeContext";
import { supabase } from "./supabaseClient";


const App = () => {
  const { theme } = useTheme();
  const [labels, setLabels] = useState([]);
  const [currentView, setCurrentView] = useState("signup"); // Default to signup
  const [currentLabel, setCurrentLabel] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for active session on mount
    const checkSession = async () => {
      // ✅ Handle session detection from URL hash (invites/resets)
      await supabase.auth.getSession();

      const token = localStorage.getItem("authToken");

      // Handle invitation/profile completion route
      const isCompleteProfile = window.location.pathname === "/complete-profile" || window.location.pathname === "/accept-invite";

      if (isCompleteProfile) {
        setCurrentView("signup");
        setIsAuthenticated(!!token);
      } else if (token) {
        // Sync session with Supabase client
        supabase.auth.setSession({
          access_token: token,
          refresh_token: "" // We don't have this in storage yet, but access_token is enough for many cases
        });
        setIsAuthenticated(true);
        setCurrentView("admin_dashboard");
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
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("companyName");
      setIsAuthenticated(false);
      setCurrentView("login");
      return;
    }
    setCurrentView(view);
  };

  const handleSignup = (user) => {
    console.log("Signup successful:", user);
    setIsAuthenticated(true);
    setCurrentView("admin_dashboard");
  };

  const handleLogin = (user) => {
    console.log("Login successful:", user);
    setIsAuthenticated(true);
    setCurrentView("admin_dashboard");
  };

  const handleCreateLabel = (labelData) => {
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
    setCurrentLabel(label);
    setCurrentView("designer");
  };

  const handleDeleteLabel = (labelId) => {
    setLabels(labels.filter((label) => label.id !== labelId));
  };

  const handleSaveLabel = (labelData) => {
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
        <AppHeader onNavigate={navigateTo} currentView={currentView} />
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
              <AdminDashboard />
            )}

            {currentView === "library" && (
              <LabelLibrary
                labels={labels}
                onCreateLabel={handleCreateLabel}
                onEditLabel={handleEditLabel}
                onDeleteLabel={handleDeleteLabel}
              />
            )}

            {currentView === "designer" && (
              <LabelDesigner
                label={currentLabel}
                onSave={handleSaveLabel}
                onBack={handleBackToLibrary}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
