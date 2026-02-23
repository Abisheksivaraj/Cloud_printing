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
  darkerGray: "#1F2937",

  // Dark Mode specific
  darkBackground: "#24303F",
  darkSurface: "#313D4A",
  darkBorder: "#3D4D5C",
  darkText: "#F8FAFC",
  darkTextMuted: "#AEB7C0"
};

export const getThemeColors = (isDarkMode) => {
  if (isDarkMode) {
    return {
      bg: brandColors.darkBackground,
      surface: brandColors.darkSurface,
      border: brandColors.darkBorder,
      text: brandColors.darkText,
      textMuted: brandColors.darkTextMuted,
      primary: brandColors.primaryPink,
      secondary: brandColors.primaryBlue,
      accent: brandColors.primaryBlue
    };
  }
  return {
    bg: brandColors.lightGray,
    surface: brandColors.white,
    border: "#E2E8F0",
    text: brandColors.darkGray,
    textMuted: brandColors.mediumGray,
    primary: brandColors.primaryPink,
    secondary: brandColors.primaryBlue,
    accent: brandColors.primaryBlue
  };
};
