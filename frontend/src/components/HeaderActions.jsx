import { Tag, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";

export const AppHeader = ({ onNavigate, currentView, userRole, userData }) => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { t } = useLanguage();

  const navItems = [
    { id: "library", label: "Design Library", short: "L" },
    { id: "print_history", label: "Print History", short: "H" },
    { id: "device_management", label: "Device Management", short: "D" },
    { id: "admin_dashboard", label: "User Management", short: "A", adminOnly: true },
  ].filter(item => !item.adminOnly || userRole === 'admin');

  // Format name
  const firstName = userData?.first_name || '';
  const lastName = userData?.last_name || '';
  const displayName = firstName || lastName
    ? `${firstName} ${lastName}`.trim()
    : userData?.name || 'User';
  const displayRole = userRole?.toUpperCase() || 'OPERATOR';

  return (
    <div
      className="sticky top-0 z-50 transition-all duration-300 border-b backdrop-blur-md supports-[backdrop-filter]:bg-opacity-80"
      style={{
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: theme.border
      }}
    >
      <div className="max-w-[1920px] mx-auto px-4 md:px-6">
        <div className="flex items-center h-14 md:h-18">

          {/* Left Section: Brand (occupies 1/3 of space) */}
          <div className="flex-1 min-w-0 flex items-center">
            <div className="flex items-center gap-2 md:gap-3 cursor-pointer group select-none shrink-0" onClick={() => onNavigate("library")}>
              <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-[#39A3DD] to-[#2D82B1] rounded-lg shadow-lg shadow-blue-500/10 flex items-center justify-center transform group-hover:rotate-3 transition-transform duration-300">
                <Tag className="text-white" size={16} />
              </div>
              <div className="hidden xl:flex flex-col justify-center">
                <h1 className="text-[13px] font-black tracking-tight leading-[1.1]" style={{ color: theme.text }}>
                  <span className="text-[#39A3DD]">Perfect Labeler</span>
                </h1>
                <span className="text-[8px] font-black uppercase tracking-[0.35em] text-[#8A9BA5] mt-0.5 leading-none">
                  PRO EDITION
                </span>
              </div>
            </div>
          </div>

          {/* Center Section: Navigation (Centered within its space) */}
          <div className="px-4 shrink-0 flex justify-center">
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-2 text-[10px] md:text-[11px] font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap
                    ${currentView === item.id
                      ? 'bg-[#39A3DD] text-white shadow-lg shadow-blue-500/20'
                      : 'text-[#8A9BA5] hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Section: Actions (occupies 1/3 of space) */}
          <div className="flex-1 min-w-0 flex items-center justify-end">
            <div className="flex items-center gap-2 md:gap-3 flex-nowrap shrink-0">
              {/* Mobile Nav Icons */}
              <nav className="flex lg:hidden items-center gap-0.5 mr-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`p-2 rounded-lg transition-all
                        ${currentView === item.id
                        ? 'text-[#39A3DD] bg-blue-50 dark:bg-blue-900/20'
                        : 'text-[#8A9BA5] hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    title={item.label}
                  >
                    <span className="text-[10px] font-black">{item.short}</span>
                  </button>
                ))}
              </nav>

              {/* Profile Block */}
              <div className="hidden sm:flex items-center gap-2.5 bg-gray-50/80 dark:bg-gray-800/40 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-black tracking-tight leading-none whitespace-nowrap text-right" style={{ color: theme.text }}>
                    {displayName}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-[0.05em] text-[#39A3DD] mt-1 opacity-90">
                    {displayRole}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-[#38474F] text-white flex items-center justify-center text-[10px] font-black shadow-inner uppercase shrink-0">
                  {displayName[0]}
                </div>
              </div>

              {/* Global Actions */}
              <div className="flex items-center gap-0.5 sm:gap-1 ml-1 shrink-0">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
                  style={{ color: theme.textMuted }}
                  title={isDarkMode ? "Light Mode" : "Dark Mode"}
                >
                  {isDarkMode ? <Sun size={17} className="text-yellow-400" /> : <Moon size={17} className="text-slate-500" />}
                </button>

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-0.5 hidden md:block"></div>

                <button
                  onClick={() => onNavigate("logout")}
                  className="flex items-center gap-1.5 px-2 md:px-3 py-2 rounded-lg transition-all border border-transparent hover:border-red-100 hover:bg-red-50 dark:hover:bg-red-900/10 group"
                >
                  <LogOut size={15} className="text-red-500 group-hover:scale-110 transition-transform" />
                  <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest text-red-500">
                    {t.logout || "Logout"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
