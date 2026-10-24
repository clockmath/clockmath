/** Colour arithmetic for the station design's computed shades (WCAG maths). */

/** "#rrggbb" → [r, g, b] (0–255). */
export const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

/** WCAG relative luminance of an [r, g, b] colour. */
export function luminance(rgb: number[]): number {
  const [r, g, b] = rgb.map((c) => c / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two [r, g, b] colours. */
export const contrast = (a: number[], b: number[]) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

/**
 * A split-flap tile's colour on a board of `hex`: a darker shade of a mid
 * colour, a lighter one of near-black (a darker black is still black) or of
 * a pale board (Easter lilac, the weekend's yellow), whose ink is dark.
 */
export function tileShade(hex: string): string {
  const rgb = channels(hex)
  const lum = luminance(rgb)
  const mix = (to: number, p: number) => `rgb(${rgb.map((c) => Math.round(c * p + to * (1 - p))).join(" ")})`
  if (lum < 0.05) return mix(255, 0.84)
  if (lum > 0.4) return mix(255, 0.5)
  return mix(0, 0.7)
}
