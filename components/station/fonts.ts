import { Archivo as Archivo_ } from "next/font/google"

/**
 * Archivo for the station-clock design. Variable on width as well as
 * weight: the big answers and countdown numerals are set condensed
 * (font-stretch 62–72%), body text at 100%. Declared here rather than in
 * app/fonts.ts: next/font preloads every font in a module the root layout
 * imports, which put this file on every page of the site.
 */
export const Archivo = Archivo_({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
})
