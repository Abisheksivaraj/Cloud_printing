import React, { useState } from "react";
import { Tag } from "lucide-react";
import LabelLibrary from "./components/LabelLibrary";
import {
  AppHeader,
  SystemSettingsModal,
  AboutModal,
} from "./components/HeaderActions";
import LabelDesigner from "./components/LabelDesign"; // ← FIXED: Import LabelDesigner, NOT DesignCanvas

const App = () => {
  const [labels, setLabels] = useState([]);
  const [currentView, setCurrentView] = useState("library");
  const [currentLabel, setCurrentLabel] = useState(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppHeader />

      {/* Main Content */}
      {currentView === "library" ? (
        <LabelLibrary
          labels={labels}
          onCreateLabel={handleCreateLabel}
          onEditLabel={handleEditLabel}
          onDeleteLabel={handleDeleteLabel}
        />
      ) : (
        <LabelDesigner
          label={currentLabel}
          onSave={handleSaveLabel}
          onBack={handleBackToLibrary}
        />
      )}
    </div>
  );
};

export default App;
