// DALAN brand tokens for the product demo video.
// Mirrors src/constants/theme.ts from the app so the recreated screens feel authentic.

export const Brand = {
  green: "#015144",
  white: "#ffffff",
  yellow: "#FEBE3C",
} as const;

export const C = {
  text: "#000000",
  background: "#ffffff",
  backgroundElement: "#F0F0F3",
  backgroundSelected: "#E0E1E6",
  textSecondary: "#60646C",
  hairline: "rgba(0,0,0,0.06)",
  pill: "#F4F5F6",
} as const;

export const Risk = {
  high: "#FF3B30",
  moderate: "#FF9500",
  low: "#EAB308",
} as const;

// System font stack — "System font" per the brief.
export const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", "Helvetica Neue", Arial, sans-serif';

// Phone frame geometry inside the 1080x1920 canvas.
export const PHONE = {
  width: 712,
  height: 1486,
  bezel: 16,
  radius: 86,
  screenRadius: 70,
} as const;

// Soft spring-like easing used across scenes.
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
