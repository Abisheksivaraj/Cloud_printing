import React, { useState } from "react";
import { Tag } from "lucide-react";
import LabelLibrary from "./components/LabelLibrary";
import {
  AppHeader,
  SystemSettingsModal,
  AboutModal,
} from "./components/HeaderActions";
import LabelDesigner from "./components/LabelDesign";
import Signup from "./components/admin/Signup";
import Login from "./components/admin/Login";
import AdminDashboard from "./components/admin/AdminDashboard";
import { useTheme } from "./ThemeContext";

const App = () => {
  const { theme } = useTheme();
  const [labels, setLabels] = useState([]);
  const [currentView, setCurrentView] = useState("signup"); // Default to signup
  const [currentLabel, setCurrentLabel] = useState(null);
  const [isAdminCreated, setIsAdminCreated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Manage navigation
  const navigateTo = (view) => {
    setCurrentView(view);
  };

  const handleSignup = (data) => {
    console.log("Signup Info:", data);
    setIsAdminCreated(true);
    setIsAuthenticated(true);
    setCurrentView("admin_dashboard");
  };

  const handleLogin = (data) => {
    console.log("Login Info:", data);
    if (isAdminCreated) {
      setIsAuthenticated(true);
      setCurrentView("admin_dashboard");
    } else {
      alert("Admin account not found. Please sign up first.");
      setCurrentView("signup");
    }
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
    <div
      className="min-h-screen transition-colors duration-300 flex flex-col"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* Navigation / Header - Only show for main app functionality */}
      {(isAuthenticated || currentView === "library" || currentView === "designer" || currentView === "admin_dashboard") && (
        <AppHeader onNavigate={navigateTo} currentView={currentView} />
      )}

      <main className="flex-1">
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
      </main>
    </div>
  );
};

export default App;
