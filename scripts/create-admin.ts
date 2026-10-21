import { writeFileSync } from "node:fs";
import { join } from "node:path";
process.env.NODE_ENV = "production";
const { database, createUser, dataDir } = await import("../src/lib/db.ts");
const db = database();
if (
  db
    .prepare("SELECT id FROM users WHERE active=1 AND role=? LIMIT 1")
    .get("admin")
) {
  console.log(
    "Ya existe una cuenta administradora. No se reemplazó ningún acceso.",
  );
} else {
  const password =
    process.env.BRUNETTE_ADMIN_PASSWORD ||
    "5ekT7jBxSpgXVz4I7JmcCPxn";
  const email = process.env.BRUNETTE_ADMIN_EMAIL || "admin@brunette.local";
  createUser("Administrador", email, password, "admin");
  const site = process.env.BRUNETTE_SITE_URL || "http://127.0.0.1:4321";
  const file = join(dataDir, "primer-acceso.txt");
  writeFileSync(
    file,
    `Primer acceso a Brunette\n\nPanel: ${site}/admin\nUsuario: ${email}\nContraseña: ${password}\n\nCambiá tu contraseña desde Ayuda y guardala en un lugar privado.\n`,
    { mode: 0o600 },
  );
  console.log("Cuenta creada. Los datos de acceso quedaron en " + file);
}
db.close();
