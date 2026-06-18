/**
 * Morning After — "night out" visual language.
 * Dark base with a purple → blue → pink gradient. The whole app is dark-mode only.
 */

export const Night = {
  // Backgrounds
  bg: '#0B0614', // near-black with a violet tint
  bgElevated: '#160F26',
  card: 'rgba(255,255,255,0.06)',
  cardBorder: 'rgba(255,255,255,0.10)',

  // Brand spectrum
  purple: '#8B5CF6',
  indigo: '#6366F1',
  blue: '#3B82F6',
  pink: '#EC4899',
  magenta: '#D946EF',

  // Text
  text: '#FFFFFF',
  textSecondary: '#B9B2CC',
  textMuted: '#6E6786',

  // Status
  success: '#34D399',
  danger: '#F87171',
  locked: '#7C74A8',
} as const;

/** Primary CTA / hero gradient (top-left → bottom-right). */
export const HeroGradient = ['#8B5CF6', '#6366F1', '#EC4899'] as const;
/** Softer background wash. */
export const BackdropGradient = ['#160F26', '#0B0614', '#1A0B1F'] as const;
/** The reveal "sunrise" moment. */
export const SunriseGradient = ['#EC4899', '#F59E0B', '#FBBF24'] as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

/** Gradient directions — vary these across the app so it doesn't feel uniform. */
export const GradDir = {
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  diagonalUp: { start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
  horizontal: { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
  vertical: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
  ttb: { start: { x: 0.15, y: 0 }, end: { x: 0.85, y: 1 } },
} as const;

export const Space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
