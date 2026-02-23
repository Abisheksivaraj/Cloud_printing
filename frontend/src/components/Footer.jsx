import React from "react";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";
import { Shield, Heart } from "lucide-react";

/* 
  Footer Component
  Refactored to align with the new design system.
  Uses theme variables for colors and borders.
*/

const Footer = () => {
  const { theme, isDarkMode } = useTheme();
  // If translation is needed later, useLanguage hook can be used.
  // const { t } = useLanguage(); 
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="py-8 border-t transition-colors duration-300 mt-auto"
      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Copyright Section */}
          <div className="flex flex-col md:flex-row items-center gap-2 text-sm font-medium text-center md:text-left" style={{ color: theme.textMuted }}>
            <div className="flex items-center gap-2">
              <span>&copy; {currentYear}</span>
              <span className="font-bold" style={{ color: theme.text }}>Archery Technocrats</span>
            </div>
            <span className="hidden md:inline text-gray-300 dark:text-gray-700">•</span>
            <span>All rights reserved.</span>
          </div>

          {/* Links Section */}
          <div className="flex items-center gap-8">
            <a
              href="#"
              className="text-xs font-bold uppercase tracking-wider hover:text-[var(--color-primary)] transition-colors relative group"
              style={{ color: theme.textMuted }}
            >
              Privacy Policy
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-primary)] transition-all group-hover:w-full"></span>
            </a>
            <a
              href="#"
              className="text-xs font-bold uppercase tracking-wider hover:text-[var(--color-primary)] transition-colors relative group"
              style={{ color: theme.textMuted }}
            >
              Terms of Service
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-primary)] transition-all group-hover:w-full"></span>
            </a>
          </div>

          {/* Security Badge */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full border bg-opacity-50 shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.bg }}
          >
            <Shield size={14} className="text-[var(--color-success)]" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80" style={{ color: theme.text }}>
              Secure Enterprise System
            </span>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div className="mt-8 pt-8 border-t flex justify-center" style={{ borderColor: theme.border }}>
          <p className="flex items-center gap-2 text-xs font-medium opacity-60 hover:opacity-100 transition-opacity" style={{ color: theme.textMuted }}>
            Designed & Developed with <Heart size={12} className="text-red-500 fill-current animate-pulse" /> by Archery Technocrats Team
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
