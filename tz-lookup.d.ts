// tz-lookup ships no types; it exports a single function that maps
// (latitude, longitude) to an IANA timezone name.
declare module "tz-lookup" {
  export default function tzlookup(lat: number, lon: number): string;
}
