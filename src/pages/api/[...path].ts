import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { getPublicContent } from "../../lib/content.ts";
import { presentationMode } from "../../lib/deployment.ts";
import {
  database,
  dataDir,
  readContent,
  saveDraft,
  publish,
  restoreVersion,
  login,
  logout,
  createSession,
  sessionUser,
  createUser,
  changePassword,
  users,
  audit,
} from "../../lib/db.ts";

const attempts = new Map<string, { count: number; expires: number }>();
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export const ALL: APIRoute = async (ctx) => {
  const { request, cookies, params } = ctx;
  const route = params.path || "";
  const method = request.method;
  const token = cookies.get("brunette_session")?.value;
  try {
    if (method === "GET" && route === "catalog")
      return json(getPublicContent());
    if (presentationMode)
      return json(
        { error: "Esta demo no incluye edición ni cuentas de administración." },
        404,
      );
    if (
      !["GET", "HEAD"].includes(method) &&
      request.headers.get("origin") !== new URL(request.url).origin
    )
      return json(
        { error: "No se permite esta solicitud desde otro sitio." },
        403,
      );
    const size = Number(request.headers.get("content-length") || 0);
    if (size > 9 * 1024 * 1024)
      return json(
        { error: "El archivo o formulario es demasiado grande." },
        413,
      );
    if (method === "POST" && route === "auth/login") {
      if (size > 8192)
        return json({ error: "Solicitud demasiado grande." }, 413);
      const body = await request.json();
      if (
        typeof body.email !== "string" ||
        typeof body.password !== "string" ||
        body.email.length > 200 ||
        body.password.length > 256
      )
        return json({ error: "Revisá los datos de acceso." }, 400);
      let address = "local";
      try {
        address = ctx.clientAddress;
      } catch {}
      const key = address + ":" + body.email.toLowerCase();
      const now = Date.now();
      for (const [k, v] of attempts) if (v.expires < now) attempts.delete(k);
      const entry = attempts.get(key) || {
        count: 0,
        expires: now + 15 * 60 * 1000,
      };
      if (entry.count >= 6)
        return json(
          {
            error:
              "Hubo varios intentos. Esperá 15 minutos antes de volver a intentar.",
          },
          429,
        );
      entry.count++;
      attempts.set(key, entry);
      const user = login(body.email, body.password);
      if (!user)
        return json(
          { error: "El correo o la contraseña no son correctos." },
          401,
        );
      attempts.delete(key);
      const session = createSession(user.id);
      cookies.set("brunette_session", session, {
        httpOnly: true,
        sameSite: "strict",
        secure: new URL(request.url).protocol === "https:",
        path: "/",
        maxAge: 43200,
      });
      audit("Inició sesión", user.name);
      return json({ user });
    }
    const user = sessionUser(token);
    if (!user) return json({ error: "Iniciá sesión para continuar." }, 401);
    if (route === "auth/logout" && method === "POST") {
      logout(token);
      cookies.delete("brunette_session", { path: "/" });
      return json({ ok: true });
    }
    if (route === "auth/me" && method === "GET") return json({ user });
    if (route === "admin/content" && method === "GET")
      return json({
        draft: readContent("draft"),
        publishedRevision: readContent().revision,
        user,
      });
    if (route === "admin/content" && method === "PUT") {
      const raw = await request.text();
      if (raw.length > 2_000_000)
        return json({ error: "El contenido es demasiado grande." }, 413);
      const body = JSON.parse(raw);
      const content = saveDraft(body.content, body.expectedRevision, user.name);
      return json({ draft: content });
    }
    if (route === "admin/publish" && method === "POST") {
      const body = await request.json();
      const content = publish(body.expectedRevision, user.name);
      return json({ content });
    }
    if (route === "admin/history" && method === "GET")
      return json({
        versions: database()
          .prepare(
            "SELECT id,created,author FROM versions ORDER BY created DESC LIMIT 50",
          )
          .all(),
        activity: database()
          .prepare(
            "SELECT action,created,author FROM audit ORDER BY created DESC LIMIT 30",
          )
          .all(),
      });
    if (route === "admin/restore" && method === "POST") {
      const body = await request.json();
      return json({
        draft: restoreVersion(body.id, body.expectedRevision, user.name),
      });
    }
    if (route === "admin/export" && method === "GET")
      return new Response(
        JSON.stringify(
          { published: readContent(), draft: readContent("draft") },
          null,
          2,
        ),
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition":
              'attachment; filename="brunette-contenido.json"',
            "Cache-Control": "no-store",
          },
        },
      );
    if (route === "admin/uploads" && method === "POST") {
      const form = await request.formData();
      const file = form.get("file");
      if (
        !(file instanceof File) ||
        file.size < 12 ||
        file.size > 8 * 1024 * 1024
      )
        return json(
          { error: "Elegí una imagen JPG, PNG o WebP de hasta 8 MB." },
          400,
        );
      const buffer = Buffer.from(await file.arrayBuffer());
      let ext = "";
      if (buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255])))
        ext = "jpg";
      else if (
        buffer
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      )
        ext = "png";
      else if (
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
      )
        ext = "webp";
      if (!ext)
        return json(
          { error: "El archivo debe ser una imagen JPG, PNG o WebP válida." },
          400,
        );
      let optimized: Buffer;
      try {
        optimized = await sharp(buffer, { limitInputPixels: 40_000_000 })
          .rotate()
          .resize({
            width: 2000,
            height: 2000,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer();
      } catch {
        return json(
          {
            error:
              "La imagen no se pudo abrir o es demasiado grande. Probá con otra foto.",
          },
          400,
        );
      }
      const name = randomUUID() + ".webp";
      await mkdir(join(dataDir, "uploads"), { recursive: true });
      await writeFile(join(dataDir, "uploads", name), optimized, {
        flag: "wx",
      });
      audit("Subió una imagen", user.name);
      return json({ url: "/media/" + name });
    }
    if (route === "admin/password" && method === "POST") {
      const body = await request.json();
      if (
        typeof body.currentPassword !== "string" ||
        typeof body.password !== "string" ||
        !login(user.email, body.currentPassword)
      )
        return json({ error: "La contraseña actual no es correcta." }, 400);
      changePassword(user.id, body.password);
      cookies.delete("brunette_session", { path: "/" });
      return json({ ok: true });
    }
    if (route === "admin/users") {
      if (user.role !== "admin")
        return json(
          { error: "Solo la persona administradora puede gestionar accesos." },
          403,
        );
      if (method === "GET") return json({ users: users() });
      if (method === "POST") {
        const body = await request.json();
        if (!["admin", "editor"].includes(body.role))
          throw new Error("Elegí un rol válido.");
        const id = createUser(body.name, body.email, body.password, body.role);
        audit("Creó un acceso de personal", user.name);
        return json({ id }, 201);
      }
      if (method === "PATCH") {
        const body = await request.json();
        if (body.id === user.id)
          throw new Error(
            "Para cambiar tu contraseña, entrá en Ayuda. No podés desactivar tu propio acceso.",
          );
        if (
          typeof body.id !== "string" ||
          !database().prepare("SELECT id FROM users WHERE id=?").get(body.id)
        )
          throw new Error("No se encontró ese acceso.");
        if (typeof body.active === "boolean") {
          database()
            .prepare("UPDATE users SET active=? WHERE id=?")
            .run(body.active ? 1 : 0, body.id);
          if (!body.active)
            database()
              .prepare("DELETE FROM sessions WHERE user_id=?")
              .run(body.id);
          audit(
            body.active ? "Reactivó un acceso" : "Desactivó un acceso",
            user.name,
          );
        } else if (typeof body.password !== "string")
          throw new Error("Elegí qué cambiar de este acceso.");
        if (typeof body.password === "string") {
          changePassword(body.id, body.password);
          audit("Restableció la contraseña de un acceso", user.name);
        }
        return json({ ok: true });
      }
    }
    return json({ error: "No se encontró esa opción." }, 404);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo completar la acción.";
    if (message.includes("UNIQUE constraint"))
      return json({ error: "Ese correo ya tiene un acceso." }, 400);
    if (message.startsWith("CONFLICT:"))
      return json({ error: message.replace("CONFLICT: ", "") }, 409);
    return json(
      {
        error: message.startsWith("SQLITE")
          ? "No se pudieron guardar los cambios."
          : message,
      },
      400,
    );
  }
};
