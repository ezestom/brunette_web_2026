/** This server-only build flag is embedded in the Vercel presentation bundle. */
export const presentationMode =
  process.env.BRUNETTE_PRESENTATION === "1" ||
  import.meta.env?.BRUNETTE_PRESENTATION === "1";
