const HEX_COLOR_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeHexColor(value: string | undefined | null, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  const match = trimmed.match(HEX_COLOR_PATTERN);
  if (!match) return fallback;
  const raw = match[1].toLowerCase();
  const expanded = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw;
  return `#${expanded}`;
}

export function tryNormalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(HEX_COLOR_PATTERN);
  if (!match) return null;
  const raw = match[1].toLowerCase();
  const expanded = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw;
  return `#${expanded}`;
}

export function getColorFamilyLabel(hex: string): string {
  const normalized = normalizeHexColor(hex, '#1a1b20');
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const lightness = ((max + min) / 2) / 255;

  if (chroma < 12) {
    if (lightness < 0.18) return 'Very dark gray';
    if (lightness < 0.4) return 'Dark gray';
    if (lightness < 0.7) return 'Gray';
    return 'Light gray';
  }

  let hue = 0;
  if (max === r) hue = ((g - b) / chroma) % 6;
  else if (max === g) hue = (b - r) / chroma + 2;
  else hue = (r - g) / chroma + 4;
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  if (hue < 15 || hue >= 345) return 'Red';
  if (hue < 45) return 'Orange';
  if (hue < 70) return 'Yellow';
  if (hue < 160) return 'Green';
  if (hue < 200) return 'Cyan';
  if (hue < 260) return 'Blue';
  if (hue < 300) return 'Purple';
  if (hue < 345) return 'Pink';
  return 'Color';
}
