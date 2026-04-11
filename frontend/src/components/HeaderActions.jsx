import { Tag, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";

export const AppHeader = ({ onNavigate, currentView, userRole, userData }) => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { t } = useLanguage();

  const navItems = [
    { id: "library", label: "Design Library", short: "L" },
     { id: "device_management", label: "Printer Management", short: "D" },
    { id: "print_history", label: "Print History", short: "H" },
   
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
    <header
      className="sticky top-0 z-50 transition-all duration-300 border-b glass"
      style={{
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        borderColor: theme.border
      }}
    >
      <div className="max-w-[1920px] mx-auto px-6">
        <div className="flex items-center h-16 md:h-20">

          {/* Left Section: Brand */}
          <div className="flex-1 flex items-center">
            <div 
              className="flex items-center gap-3 cursor-pointer group select-none shrink-0" 
              onClick={() => onNavigate("library")}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[#075985] rounded-xl shadow-lg shadow-sky-500/20 flex items-center justify-center transform group-hover:scale-105 transition-all duration-300">
                <Tag className="text-white" size={20} />
              </div>
              <div className="hidden xl:flex flex-col justify-center">
                <h1 className="text-lg font-extrabold tracking-tight leading-none" style={{ color: theme.text }}>
                  Perfect<span className="text-[var(--color-primary)]">Labeler</span>
                </h1>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
                  Enterprise Edition
                </span>
              </div>
            </div>
          </div>

          {/* Center Section: Navigation */}
          <div className="px-6 flex justify-center">
            <nav className="hidden lg:flex items-center gap-2 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all
                    ${currentView === item.id
                      ? 'bg-white dark:bg-slate-700 text-[var(--color-primary)] shadow-sm'
                      : 'text-slate-500 hover:text-[var(--color-primary)]'}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Section: Actions */}
          <div className="flex-1 flex items-center justify-end">
            <div className="flex items-center gap-4">
              {/* Mobile Nav Icons */}
              <nav className="flex lg:hidden items-center gap-1 mr-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all
                        ${currentView === item.id
                        ? 'text-[var(--color-primary)] bg-sky-50 dark:bg-sky-900/20 shadow-sm border border-sky-100 dark:border-sky-800'
                        : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    title={item.label}
                  >
                    <span className="text-[11px] font-bold">{item.short}</span>
                  </button>
                ))}
              </nav>

              {/* Profile Block */}
              <div className="hidden sm:flex items-center gap-3 pl-3 pr-1.5 py-1.5 transition-all">
                <button 
                  onClick={() => onNavigate("profile")}
                  title={`Profile Settings (${displayName})`}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-[var(--color-primary)] flex items-center justify-center text-sm font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:scale-105 hover:border-[var(--color-primary)] hover:shadow-md cursor-pointer uppercase"
                >
                  {displayName[0]}
                </button>
              </div>

              {/* Theme Toggle & Logout */}
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleTheme}
                  className="w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  title={isDarkMode ? "Light Mode" : "Dark Mode"}
                >
                  {isDarkMode ? <Sun size={ 18 } className="text-yellow-500" /> : <Moon size={ 18 } className="text-slate-400" />}
                </button>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                <button
                  onClick={() => onNavigate("logout")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-rose-100 hover:bg-rose-50 dark:hover:bg-rose-900/10 group group"
                >
                  <LogOut size={16} className="text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                  <span className="hidden md:inline text-xs font-bold uppercase tracking-wider text-rose-500">
                    {t.logout || "Logout"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
