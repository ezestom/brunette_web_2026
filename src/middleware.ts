import { defineMiddleware } from "astro:middleware";
export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  if (/^\/(?:data|backups)(?:\/|$)/i.test(path))
    return new Response("No encontrado", { status: 404 });
  const response = await next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  if (
    path.startsWith("/admin") ||
    path.startsWith("/api/admin") ||
    path.startsWith("/api/auth")
  ) {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Cache-Control", "no-store");
  }
  return response;
});
