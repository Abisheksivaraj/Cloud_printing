import React from "react";
import { Tag, Sun, Moon, LogOut, Bell, User } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";
import logo from "../assets/companyLogo.png";

export const AppHeader = ({ onNavigate }) => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { t } = useLanguage();

  return (
    <header
      className="sticky top-0 z-50 border-b transition-colors duration-300"
      style={{
        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        borderColor: isDarkMode ? '#374151' : '#E5E7EB'
      }}
    >
      <div className="max-w-[1920px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">

        {/* Brand Section */}
        <div
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => onNavigate("dashboard")}
        >
          <div className="h-10 px-3 bg-white border border-gray-100 rounded shadow-sm flex items-center justify-center transition-transform group-hover:scale-105">
            <img src={logo} alt="Archery Technocrats" className="h-6 object-contain" />
          </div>
          <div className="hidden sm:block border-l pl-4 border-gray-100">
            <h1 className="text-lg font-black tracking-tight leading-none text-[#38474F]" style={{ color: theme.text }}>
              PERFECT <span className="text-[#39A3DD]">LABELER</span>
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8A9BA5] mt-1">
              Cloud Solutions
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications Placeholder */}
          <button className="p-2 text-[#8A9BA5] hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors">
            <Bell size={20} />
          </button>

          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2"
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-[#38474F]" />}
          </button>

          {/* User Profile / Logout */}
          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-100">
            <div className="hidden md:block text-right">
              <p className="text-xs font-black text-[#38474F] uppercase tracking-wider" style={{ color: theme.text }}>Admin User</p>
              <p className="text-[10px] text-[#8A9BA5] font-bold">Project Manager</p>
            </div>

            <button
              onClick={() => onNavigate("logout")}
              className="flex items-center justify-center h-10 w-10 bg-gray-50 hover:bg-red-50 text-[#8A9BA5] hover:text-red-500 rounded border border-gray-100 transition-all"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
