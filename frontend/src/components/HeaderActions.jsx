// cSpell:words ATPL Archery Technocrats
import React, { useState } from "react";
import { Tag, Settings, Info, X, Sun, Moon, Shield } from "lucide-react";
import DetailedInfo from "./DetailedInfo";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";

// System Settings Modal Component
export const SystemSettingsModal = ({ onClose }) => {
  const { isDarkMode, theme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [unit, setUnit] = useState("mm");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
      <div
        className="w-full max-w-md rounded-[2.5rem] shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-300"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between p-8 border-b bg-gradient-to-r from-[#E85874] to-[#C4455D] text-white">
          <div>
            <h3 className="text-2xl font-black tracking-tight uppercase">{t.systemHub}</h3>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{t.configurationPanel}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>
              {t.languageSettings}
            </h4>
            <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
              <label className="text-xs font-bold" style={{ color: theme.text }}>Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-xs font-black focus:outline-none cursor-pointer"
                style={{ color: theme.text }}
              >
                <option value="English">ENGLISH</option>
                <option value="Spanish">SPANISH</option>
                <option value="French">FRENCH</option>
                <option value="German">GERMAN</option>
                <option value="Chinese">CHINESE</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>{t.unitPrecision}</h4>
            <div className="grid grid-cols-2 gap-4">
              {['mm', 'in'].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 ${unit === u ? 'border-[#39A3DD] bg-[#39A3DD]/10 text-[#39A3DD]' : 'border-transparent'
                    }`}
                  style={{ backgroundColor: unit === u ? undefined : theme.bg, color: unit === u ? undefined : theme.textMuted }}
                >
                  {u === 'mm' ? 'Millimeters' : 'Inches'}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 border-transparent hover:border-[#39A3DD]/30" style={{ backgroundColor: theme.bg, color: theme.textMuted }}>
            {t.fileAssociation}
          </button>
        </div>

        <div className="flex justify-end space-x-4 p-8 border-t" style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: theme.border }}>
          <button onClick={onClose} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-colors" style={{ color: theme.textMuted }}>
            {t.cancel}
          </button>
          <button onClick={onClose} className="px-10 py-3 bg-[#E85874] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-[#C4455D] transition-all">
            {t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AboutModal = ({ onClose }) => {
  const { isDarkMode, theme } = useTheme();
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);

  if (showDetails) {
    return <DetailedInfo onClose={onClose} onBack={() => setShowDetails(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
      <div
        className="w-full max-w-xl rounded-[2.5rem] shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-300"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between p-8 border-b bg-gradient-to-r from-[#E85874] to-[#C4455D] text-white">
          <div>
            <h3 className="text-2xl font-black tracking-tight uppercase">{t.coreInfo}</h3>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{t.systemIntelligence}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-12 text-center space-y-8">
          <div className="w-24 h-24 bg-gradient-to-br from-[#E85874] to-[#C4455D] rounded-3xl mx-auto flex items-center justify-center shadow-2xl transform -rotate-12">
            <Tag className="text-white" size={48} />
          </div>

          <div>
            <h2 className="text-3xl font-black tracking-tighter" style={{ color: theme.text }}>
              Label Manager <span className="text-[#39A3DD]">Pro</span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2" style={{ color: theme.textMuted }}>{t.enterpriseEdition}</p>
          </div>

          <div className="p-6 rounded-[2rem] border transition-colors" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
            <p className="text-sm font-black" style={{ color: theme.text }}>{t.version}: 2026.01.H1</p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-2" style={{ color: theme.textMuted }}>{t.synchronized}</p>
            <a href="https://www.atplgroup.com" target="_blank" rel="noreferrer" className="text-[#39A3DD] text-[10px] font-black uppercase tracking-widest hover:underline mt-4 inline-block">
              {t.documentation}
            </a>
          </div>

          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-[#E85874] to-[#C4455D] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Shield size={80} /></div>
            <p className="font-black text-xs uppercase tracking-[0.2em] relative z-10">{t.targetPerfection}</p>
            <p className="text-[10px] font-medium text-white/80 mt-1 relative z-10">{t.bespokeSolution}</p>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30" style={{ color: theme.text }}>{t.copyright}</p>
        </div>

        <div className="flex justify-end space-x-4 p-8 border-t" style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: theme.border }}>
          <button onClick={onClose} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-colors" style={{ color: theme.textMuted }}>
            {t.close}
          </button>
          <button onClick={() => setShowDetails(true)} className="px-10 py-3 bg-[#39A3DD] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-[#2A7FAF] transition-all flex items-center space-x-2">
            <Info size={16} />
            <span>{t.viewDetails}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const AppHeader = ({ onNavigate, currentView }) => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <div className="shadow-sm border-b sticky top-0 z-50 transition-colors duration-300" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate("library")}>
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#E85874] to-[#C4455D] rounded-xl shadow-lg">
                  <Tag className="text-white" size={20} />
                </div>
                <h1 className="text-lg font-bold" style={{ color: theme.text }}>{t.labelManagerPro}</h1>
              </div>
              <nav className="hidden md:flex items-center space-x-1">
                <button onClick={() => onNavigate("library")} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${currentView === "library" || currentView === "designer" ? isDarkMode ? "bg-pink-500/20 text-pink-400" : "bg-[#FDD7E0] text-[#E85874]" : "text-gray-400 hover:text-[#E85874] hover:bg-gray-50/10"}`}>
                  {t.designer}
                </button>
                <button onClick={() => onNavigate("admin_dashboard")} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${currentView === "admin_dashboard" ? isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-[#D4EAF7] text-[#39A3DD]" : "text-gray-400 hover:text-[#39A3DD] hover:bg-gray-50/10"}`}>
                  {t.admin}
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={toggleTheme} className="p-2 rounded-xl transition-all hover:scale-110 active:scale-95" style={{ backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }}>
                {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-600" />}
              </button>
              <button onClick={() => setShowAbout(true)} className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors border group" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                <Info size={16} className="text-gray-400" />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>{t.info}</span>
              </button>
              <button onClick={() => setShowSettings(true)} className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors border group" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                <Settings size={16} className="text-gray-400 group-hover:rotate-90 transition-all duration-300" />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>{t.settings}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {showSettings && <SystemSettingsModal onClose={() => setShowSettings(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  );
};

export default AppHeader;
