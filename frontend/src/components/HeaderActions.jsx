import React, { useState } from "react";
import { Tag, Settings, Info, X } from "lucide-react";

// System Settings Modal Component
export const SystemSettingsModal = ({ onClose }) => {
  const [unit, setUnit] = useState("mm");
  const [language, setLanguage] = useState("English");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b bg-[#E85874] text-white rounded-t-lg">
          <h3 className="text-lg font-bold">System settings</h3>
          <button onClick={onClose} className="hover:bg-[#C4455D] p-1 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Language Settings */}
          <div className="bg-[#FDD7E0] rounded-lg p-4">
            <h4 className="font-semibold text-[#38474F] mb-3">
              Language settings
            </h4>
            <div className="flex items-center justify-between">
              <label className="text-[#38474F]">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 border border-[#E0E4E7] rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-[#39A3DD]"
              >
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Chinese</option>
              </select>
            </div>
          </div>

          {/* Unit Settings */}
          <div className="bg-[#FDD7E0] rounded-lg p-4">
            <h4 className="font-semibold text-[#38474F] mb-3">Unit</h4>
            <div className="flex items-center space-x-6">
              <span className="text-[#38474F]">Unit</span>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={unit === "mm"}
                  onChange={() => setUnit("mm")}
                  className="w-4 h-4 text-[#E85874] focus:ring-[#E85874]"
                />
                <span className="text-[#38474F]">MM</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={unit === "in"}
                  onChange={() => setUnit("in")}
                  className="w-4 h-4 text-[#E85874] focus:ring-[#E85874]"
                />
                <span className="text-[#38474F]">In</span>
              </label>
            </div>
          </div>

          {/* File Association Button */}
          <button className="w-full px-4 py-2 bg-[#F5F7F9] hover:bg-[#8A9BA5] hover:text-white rounded-lg text-[#38474F] font-medium transition-colors">
            File association
          </button>
        </div>

        <div className="flex justify-end space-x-3 p-4 border-t bg-[#F5F7F9] rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#38474F] hover:bg-[#F5F7F9] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#E85874] text-white rounded-lg hover:bg-[#C4455D] transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// About/Version Modal Component
export const AboutModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b bg-[#E85874] text-white rounded-t-lg">
          <h3 className="text-lg font-bold">ABOUT</h3>
          <button onClick={onClose} className="hover:bg-[#C4455D] p-1 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-[#E85874] to-[#C4455D] rounded-2xl p-8 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="grid grid-cols-3 gap-1">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-white rounded-sm"></div>
                  ))}
                </div>
                <div className="text-white text-5xl font-bold">L</div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-[#E85874]">
            ATPL Cloud Printing
          </h2>

          {/* Version */}
          <div className="bg-[#D4EAF7] rounded-lg p-4">
            <p className="text-xl font-semibold text-[#38474F]">
              Version: 2026.01
            </p>
            <p className="text-[#8A9BA5] mt-2">
              Powered by Archery Technocrats
            </p>
            <a
              href="https://www.atplgroup.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#39A3DD] hover:text-[#2A7FAF] mt-2 inline-block transition-colors"
            >
              www.atplgroup.com
            </a>
          </div>

          {/* Tagline */}
          <div className="text-sm bg-[#FDD7E0] rounded-lg p-4">
            <p className="font-bold text-[#E85874] text-lg mb-2">
              TARGET PERFECTION
            </p>
            <p className="text-[#38474F]">
              Professional label design and management solution
            </p>
          </div>

          {/* Copyright */}
          <p className="text-sm text-[#8A9BA5]">
            Copyright© 2026 Archery Technocrats. All Rights Reserved.
          </p>
        </div>

        <div className="flex justify-end p-4 border-t bg-[#F5F7F9] rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#E85874] text-white rounded-lg hover:bg-[#C4455D] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// App Header Component with Settings & Version
export const AppHeader = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Side - Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#E85874] to-[#C4455D] rounded-xl shadow-lg">
                <Tag className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#38474F]">
                  Label Manager Pro
                </h1>
                <p className="text-xs text-[#8A9BA5]">
                  Professional Label Design & Management
                </p>
              </div>
            </div>

            {/* Right Side - Version and Settings */}
            <div className="flex items-center space-x-3">
              {/* Version Button */}
              <button
                onClick={() => setShowAbout(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#D4EAF7] hover:bg-[#6BB9E5] rounded-lg transition-colors"
              >
                <Info size={18} className="text-[#39A3DD]" />
                <span className="text-sm font-medium text-[#39A3DD]">
                  v2026.01
                </span>
              </button>

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#F5F7F9] hover:bg-[#8A9BA5] hover:text-white rounded-lg transition-colors group"
              >
                <Settings
                  size={18}
                  className="text-[#38474F] group-hover:text-white group-hover:rotate-90 transition-all duration-300"
                />
                <span className="text-sm font-medium text-[#38474F] group-hover:text-white">
                  Settings
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSettings && (
        <SystemSettingsModal onClose={() => setShowSettings(false)} />
      )}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  );
};

// Demo App showing integration
const DemoApp = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F7F9] to-[#D4EAF7]">
      <AppHeader />

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-[#E0E4E7]">
          <div className="inline-block p-4 bg-gradient-to-br from-[#E85874] to-[#C4455D] rounded-2xl mb-4">
            <Tag className="text-white" size={64} />
          </div>
          <h2 className="text-2xl font-bold text-[#38474F] mb-4">
            Welcome to Label Manager Pro
          </h2>
          <p className="text-[#8A9BA5] mb-6">
            Click the Settings or Version buttons in the header to see the
            modals
          </p>
          <div className="flex justify-center space-x-4">
            <button className="px-6 py-3 bg-[#E85874] text-white rounded-lg hover:bg-[#C4455D] transition-colors font-medium">
              Get Started
            </button>
            <button className="px-6 py-3 bg-[#39A3DD] text-white rounded-lg hover:bg-[#2A7FAF] transition-colors font-medium">
              Learn More
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E7] hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#FDD7E0] rounded-lg flex items-center justify-center mb-4">
              <Tag className="text-[#E85874]" size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#38474F] mb-2">
              Easy Design
            </h3>
            <p className="text-[#8A9BA5]">
              Create professional labels with our intuitive design tools
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E7] hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#D4EAF7] rounded-lg flex items-center justify-center mb-4">
              <Settings className="text-[#39A3DD]" size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#38474F] mb-2">
              Customizable
            </h3>
            <p className="text-[#8A9BA5]">
              Adjust settings to match your workflow and preferences
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-[#E0E4E7] hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#FDD7E0] rounded-lg flex items-center justify-center mb-4">
              <Info className="text-[#E85874]" size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#38474F] mb-2">
              Target Perfection
            </h3>
            <p className="text-[#8A9BA5]">
              Precision and quality in every label you create
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoApp;
