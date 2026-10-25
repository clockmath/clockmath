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

const WHITE = [255, 255, 255]
/** The dark-mode dial (station.css) */
const DARK_DIAL = channels("#0f1216")
const mixWith = (rgb: number[], to: number, p: number) => rgb.map((c) => Math.round(c * p + to * (1 - p)))
const toHex = (rgb: number[]) => `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`
/** Neither black nor white: numerals with a colour of their own (Halloween's orange) */
const colourful = (rgb: number[]) => {
  const lum = luminance(rgb)
  return lum > 0.02 && lum < 0.9
}

/**
 * An event page's colours for its links, rules and buttons, from its board's
 * colour and numerals (Oct 2026: the pages had used the Countdowns rust, so a
 * green Christmas board sat over a rust Share button). Each is the first of
 * the board colour, its numerals, then shades of the board colour that
 * reads >= 4.5:1 on the page: `text` on the white dial, `textDark` on the
 * dark one. `button` is the dark-mode button fill, behind the numerals'
 * colour: the board colour, lifted when it is near-black (a black button on
 * the near-black dial has no edge).
 */
export function eventLineColours(color: string, ink = "#ffffff") {
  const rgb = channels(color)
  const inkRgb = channels(ink)
  const pick = (candidates: number[][], bg: number[], fallback: number[]) =>
    toHex(candidates.find((c) => contrast(c, bg) >= 4.5) ?? fallback)
  return {
    text: pick([rgb, inkRgb, ...[0.8, 0.65, 0.5, 0.35].map((p) => mixWith(rgb, 0, p))], WHITE, [0, 0, 0]),
    textDark: pick(
      [...(colourful(inkRgb) ? [inkRgb] : []), rgb, ...[0.75, 0.6, 0.5, 0.4, 0.3].map((p) => mixWith(rgb, 255, p))],
      DARK_DIAL,
      WHITE,
    ),
    button: toHex(luminance(rgb) < 0.02 ? mixWith(rgb, 255, 0.78) : rgb),
  }
}
