// cSpell:words ATPL Archery Technocrats

import React, { useState } from "react";
import { Tag, Settings, Info, X } from "lucide-react";
import DetailedInfo from "./DetailedInfo";

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

          <button className="w-full px-4 py-2 bg-[#F5F7F9] hover:bg-[#8A9BA5] hover:text-white rounded-lg text-[#38474F] font-medium transition-colors">
            File association
          </button>
        </div>

        <div className="flex justify-end space-x-3 p-4 border-t bg-[#F5F7F9] rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#38474F] hover:bg-[#E0E4E7] rounded-lg transition-colors"
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

// About Modal
export const AboutModal = ({ onClose }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (showDetails) {
    return (
      <DetailedInfo onClose={onClose} onBack={() => setShowDetails(false)} />
    );
  }

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
          <h2 className="text-3xl font-bold text-[#E85874]">
            ATPL Cloud Printing
          </h2>

          <div className="bg-[#D4EAF7] rounded-lg p-4">
            <p className="text-xl font-semibold text-[#38474F]">
              Version: 2026.01
            </p>
            <p className="text-[#8A9BA5] mt-2">
              Powered by Archery Technocrats
            </p>

            {/* ✅ FIXED LINK */}
            <a
              href="https://www.atplgroup.com"
              className="text-[#39A3DD] hover:text-[#2A7FAF] mt-2 inline-block transition-colors"
            >
              www.atplgroup.com
            </a>
          </div>

          <div className="text-sm bg-[#FDD7E0] rounded-lg p-4">
            <p className="font-bold text-[#E85874] text-lg mb-2">
              TARGET PERFECTION
            </p>
            <p className="text-[#38474F]">
              Professional label design and management solution
            </p>
          </div>

          <p className="text-sm text-[#8A9BA5]">
            Copyright© 2026 Archery Technocrats. All Rights Reserved.
          </p>
        </div>

        <div className="flex justify-end space-x-3 p-4 border-t bg-[#F5F7F9] rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#38474F] hover:bg-[#E0E4E7] rounded-lg transition-colors font-medium"
          >
            Close
          </button>
          <button
            onClick={() => setShowDetails(true)}
            className="px-6 py-2 bg-[#39A3DD] text-white rounded-lg hover:bg-[#2A7FAF] transition-colors font-medium flex items-center space-x-2"
          >
            <Info size={18} />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// App Header
export const AppHeader = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAbout(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#D4EAF7] hover:bg-[#6BB9E5] rounded-lg transition-colors"
              >
                <Info size={18} className="text-[#39A3DD]" />
                <span className="text-sm font-medium text-[#39A3DD]">
                  v2026.01
                </span>
              </button>

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

      {showSettings && (
        <SystemSettingsModal onClose={() => setShowSettings(false)} />
      )}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  );
};

export default AppHeader;
