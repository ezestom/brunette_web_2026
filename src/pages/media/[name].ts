import type { APIRoute } from "astro";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDir } from "../../lib/db.ts";
import { presentationMode } from "../../lib/deployment.ts";
export const GET: APIRoute = async ({ params }) => {
  if (presentationMode) return new Response("No encontrada", { status: 404 });
  const name = params.name || "";
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(name))
    return new Response("No encontrada", { status: 404 });
  try {
    const bytes = await readFile(join(dataDir, "uploads", name));
    const type = name.endsWith("jpg")
      ? "image/jpeg"
      : name.endsWith("png")
        ? "image/png"
        : "image/webp";
    return new Response(bytes, {
      headers: {
        "Content-Type": type,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("No encontrada", { status: 404 });
  }
};
