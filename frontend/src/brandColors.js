// brandColors.js
export const brandColors = {
  primaryPink: "#E85874",
  primaryBlue: "#39A3DD",
  darkGray: "#38474F",

  lightPink: "#FDD7E0",
  mediumPink: "#F59FB5",
  darkPink: "#C4455D",

  lightBlue: "#D4EAF7",
  mediumBlue: "#6BB9E5",
  darkBlue: "#2A7FAF",

  white: "#FFFFFF",
  lightGray: "#F5F7F9",
  mediumGray: "#8A9BA5",

  // Dark Mode specific
  darkBackground: "#0F172A",
  darkSurface: "#1E293B",
  darkBorder: "#334155",
  darkText: "#F8FAFC",
  darkTextMuted: "#94A3B8"
};

export const getThemeColors = (isDarkMode) => {
  if (isDarkMode) {
    return {
      bg: brandColors.darkBackground,
      surface: brandColors.darkSurface,
      border: brandColors.darkBorder,
      text: brandColors.darkText,
      textMuted: brandColors.darkTextMuted,
      inputBg: "#1E293B",
      accentPink: brandColors.primaryPink,
      accentBlue: brandColors.primaryBlue
    };
  }
  return {
    bg: "#F8FAFC",
    surface: brandColors.white,
    border: "#E2E8F0",
    text: brandColors.darkGray,
    textMuted: brandColors.mediumGray,
    inputBg: brandColors.lightGray,
    accentPink: brandColors.primaryPink,
    accentBlue: brandColors.primaryBlue
  };
};
