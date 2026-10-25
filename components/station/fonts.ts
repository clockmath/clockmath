import { Archivo as Archivo_, Big_Shoulders } from "next/font/google"

/**
 * Archivo for the station-clock design. Variable on width as well as
 * weight: body text at 100%, the small figures condensed. Declared here
 * rather than in app/fonts.ts: next/font preloads every font in a module the
 * root layout imports, which put this file on every page of the site.
 */
export const Archivo = Archivo_({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
})

/**
 * Big Shoulders, the tall condensed lettering of Chicago's transit signs,
 * for headings and the big figures (type.css). Its optical-size axis picks
 * the display cut at large sizes on its own.
 */
export const BigShoulders = Big_Shoulders({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-shoulders",
  display: "swap",
  // next/font has no fallback metrics for this family (it warns at build);
  // the file is preloaded, so it is normally in before first paint
  adjustFontFallback: false,
})
