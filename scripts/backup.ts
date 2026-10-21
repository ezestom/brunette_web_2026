import { backup } from "node:sqlite";
import { mkdirSync, existsSync, cpSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
const { database, dataDir } = await import("../src/lib/db.ts");
const destination = resolve(
  "backups",
  new Date().toISOString().replace(/[:.]/g, "-"),
);
mkdirSync(destination, { recursive: true });
await backup(database(), join(destination, "brunette.sqlite"));
if (existsSync(join(dataDir, "uploads")))
  cpSync(join(dataDir, "uploads"), join(destination, "uploads"), {
    recursive: true,
  });
writeFileSync(
  join(destination, "LEEME.txt"),
  "Copia privada de Brunette: base de datos y fotos. Incluye contraseñas hasheadas y sesiones. No subir a un directorio público. Restaurar con el servidor detenido, en una carpeta de datos nueva.\n",
);
console.log("Copia creada en " + destination);
database().close();
