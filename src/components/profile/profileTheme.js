export const DEFAULT_PROFILE_PRIMARY = '#c06cff';
export const DEFAULT_PROFILE_BACKGROUND = '#121216';
export const DEFAULT_PROFILE_TEXT = '#f8f8f8';
export const PROFILE_SURFACE = '#1c1c21';
export const PROFILE_LIGHT_SURFACE = '#f8f8f8';
export const PROFILE_SURFACE_TEXT = '#f8f8f8';
export const PROFILE_LIGHT_SURFACE_TEXT = '#17171b';

export function normalizeHex(value, fallback = DEFAULT_PROFILE_TEXT) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : fallback;
}

export function getContrastColor(hexColor) {
  const hex = normalizeHex(hexColor);
  const rgb = [0, 2, 4].map((index) =>
    parseInt(hex.slice(index + 1, index + 3), 16)
  );
  const luminance =
    (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;

  return luminance > 0.58 ? '#17171b' : '#ffffff';
}

export function getContrastRatio(firstColor, secondColor) {
  const first = relativeLuminance(normalizeHex(firstColor));
  const second = relativeLuminance(normalizeHex(secondColor));
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getThemeContrastErrors(background, primary, text) {
  const errors = [];

  if (getContrastRatio(background, text) < 4.5) {
    errors.push('El color del texto no contrasta lo suficiente con el fondo.');
  }

  if (getContrastRatio(background, primary) < 3) {
    errors.push('El color acentuado necesita más contraste con el fondo.');
  }

  return errors;
}

export function withAlpha(hexColor, alpha = '33') {
  return `${normalizeHex(hexColor)}${alpha}`;
}

function relativeLuminance(hexColor) {
  const rgb = [0, 2, 4].map((index) =>
    parseInt(hexColor.slice(index + 1, index + 3), 16) / 255
  );
  const channels = rgb.map((channel) =>
    channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  );

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
