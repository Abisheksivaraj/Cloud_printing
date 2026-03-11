import { Tag, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";

export const AppHeader = ({ onNavigate, currentView, userRole }) => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { t } = useLanguage();

  const navItems = [
    { id: "library", label: "Design Library", short: "L" },
    { id: "print_history", label: "Print History", short: "H" },
    { id: "device_management", label: "Device Management", short: "D" },
    { id: "admin_dashboard", label: "User Management", short: "A", adminOnly: true },
  ].filter(item => !item.adminOnly || userRole === 'admin');

  return (
    <div
      className="sticky top-0 z-50 transition-all duration-300 border-b backdrop-blur-md supports-[backdrop-filter]:bg-opacity-80"
      style={{
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: theme.border
      }}
    >
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 md:h-14">

          {/* Left: Brand */}
          <div className="flex items-center gap-4 sm:gap-8">
            <div
              className="flex items-center gap-3 cursor-pointer group select-none"
              onClick={() => onNavigate("library")}
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-secondary-hover)] rounded-xl shadow-lg shadow-secondary/20 flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300 shrink-0">
                <Tag className="text-white" size={16} />

              </div>

              <div className="hidden xs:flex flex-col justify-center">
                <h1 className="text-[15px] font-black tracking-tight leading-[1.1]" style={{ color: theme.text }}>
                  ATPL's Perfect Labeler
                </h1>
                <span className="text-[9px] font-black uppercase tracking-[0.30em] text-[var(--color-primary)] mt-0.5 leading-none">
                  PRO EDITION
                </span>
              </div>
            </div>

            <nav className="flex items-center gap-0.5 sm:gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 sm:px-4 py-1.5 text-[10px] md:text-[11px] font-black uppercase tracking-widest rounded-lg transition-all 
                    ${currentView === item.id
                      ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-primary/20'
                      : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.short}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 border hover:border-gray-300 dark:hover:border-gray-600"
              style={{ backgroundColor: theme.bg, borderColor: 'transparent' }}
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-600" />}
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <button
              onClick={() => onNavigate("logout")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all border-2 border-transparent hover:border-red-100 hover:bg-red-50 dark:hover:bg-red-900/10 dark:hover:border-red-900/30 group"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-red-400 to-pink-500 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                <LogOut size={12} className="ml-0.5" />
              </div>
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest text-red-500 group-hover:text-red-600 transition-colors">
                {t.logout || "Logout"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
