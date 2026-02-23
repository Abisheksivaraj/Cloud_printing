import React from "react";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";
import { Shield, Heart, ExternalLink } from "lucide-react";

const Footer = () => {
  const { theme, isDarkMode } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="py-12 border-t transition-colors duration-300 mt-auto bg-white"
      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
    >
      <div className="max-w-[1920px] mx-auto px-8 md:px-16">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">

          {/* Copyright Section */}
          <div className="flex flex-col items-center lg:items-start gap-2">
            <h5 className="text-xs font-black uppercase tracking-[0.2em] text-[#38474F]" style={{ color: theme.text }}>
              Archery Technocrats
            </h5>
            <p className="text-[10px] font-bold text-[#8A9BA5] uppercase tracking-widest">
              © {currentYear} • TARGET PERFECTION • ALL RIGHTS RESERVED
            </p>
          </div>

          {/* Links Section */}
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
            <a
              href="#"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] hover:text-[#39A3DD] transition-colors flex items-center gap-1.5"
            >
              System Status <Activity size={12} />
            </a>
            <a
              href="#"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] hover:text-[#39A3DD] transition-colors"
            >
              Privacy Architecture
            </a>
            <a
              href="#"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] hover:text-[#39A3DD] transition-colors"
            >
              Service Protocol
            </a>
          </div>

          {/* Security Branding */}
          <div className="flex items-center gap-3 px-6 py-2.5 bg-[#F5F7F9] rounded-sm border border-gray-100 shadow-sm" style={{ backgroundColor: theme.bg }}>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#39A3DD] border border-gray-100">
              <Shield size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#38474F]" style={{ color: theme.text }}>
                Encrypted Node
              </p>
              <p className="text-[8px] font-bold text-[#8A9BA5] uppercase">Secure Enterprise Access</p>
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="mt-12 pt-8 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: theme.border }}>
          <p className="text-[9px] font-bold text-[#8A9BA5] uppercase tracking-widest flex items-center gap-2">
            Designed for Excellence with <Heart size={12} className="text-[#E85874] fill-current" /> in India
          </p>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#39A3DD]">
            v2.4.0-PRO <span className="text-[#8A9BA5]">·</span> STABLE BRANCH
          </div>
        </div>
      </div>
    </footer>
  );
};

// Internal Activity icon placeholder since I used it above
const Activity = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);

export default Footer;
