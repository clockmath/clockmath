// Cloudflare Pages Function returning the visitor's country code.
// Used by the consent banner to decide whether to prompt EEA/UK visitors.
// Cloudflare populates request.cf.country / the CF-IPCountry header at the edge.

export async function onRequestGet(context) {
  const { request } = context;

  const country =
    (request.cf && request.cf.country) ||
    request.headers.get("CF-IPCountry") ||
    "XX";

  return new Response(JSON.stringify({ country }), {
    headers: {
      "Content-Type": "application/json",
      // Country can vary per visitor; never cache shared.
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
