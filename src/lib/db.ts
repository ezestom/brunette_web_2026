import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import type { Content } from "./types.ts";
import { validateContent } from "./validation.ts";

export const dataDir = resolve(
  process.env.BRUNETTE_DATA_DIR || join(process.cwd(), "data"),
);
type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor";
  active: number;
  password_hash?: string;
};
type Row = { json: string; revision: string };
const shared = globalThis as typeof globalThis & {
  __brunetteDB?: DatabaseSync;
};
export function database() {
  if (shared.__brunetteDB) return shared.__brunetteDB;
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(join(dataDir, "brunette.sqlite"));
  db.exec(`PRAGMA journal_mode=WAL;PRAGMA busy_timeout=5000;PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS documents(key TEXT PRIMARY KEY,json TEXT NOT NULL,revision TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','editor')),active INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS versions(id TEXT PRIMARY KEY,json TEXT NOT NULL,created TEXT NOT NULL,author TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,action TEXT NOT NULL,author TEXT NOT NULL,created TEXT NOT NULL);`);
  shared.__brunetteDB = db;
  if (!db.prepare("SELECT key FROM documents LIMIT 1").get()) {
    const content = validateContent(
      JSON.parse(
        readFileSync(join(process.cwd(), "content/demo.json"), "utf8"),
      ),
    );
    content.revision = randomUUID();
    const stmt = db.prepare(
      "INSERT INTO documents(key,json,revision) VALUES (?,?,?)",
    );
    stmt.run("published", JSON.stringify(content), content.revision);
    stmt.run("draft", JSON.stringify(content), content.revision);
  }
  const adminEmail = (
    process.env.BRUNETTE_ADMIN_EMAIL || "admin@brunette.local"
  )
    .trim()
    .toLowerCase();
  const adminPassword =
    process.env.BRUNETTE_ADMIN_PASSWORD || "5ekT7jBxSpgXVz4I7JmcCPxn";
  const existingAdmin = db
    .prepare("SELECT id FROM users WHERE email=?")
    .get(adminEmail) as { id: string } | undefined;

  if (!existingAdmin) {
    createUser("Administrador", adminEmail, adminPassword, "admin");
    try {
      writeFileSync(
        join(dataDir, "primer-acceso.txt"),
        `Acceso a Brunette\n\nPanel: /admin\nUsuario: ${adminEmail}\nContraseña: ${adminPassword}\n\nCambiala desde el panel.\n`,
        { mode: 0o600 },
      );
    } catch {}
  } else if (process.env.BRUNETTE_ADMIN_PASSWORD) {
    db.prepare("UPDATE users SET password_hash=?, active=1 WHERE id=?").run(
      passwordHash(adminPassword),
      existingAdmin.id,
    );
  }
  return db;
}
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function passwordMatches(password: string, hash: string) {
  try {
    const [salt, key] = hash.split(":");
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(key, "hex");
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  } catch {
    return false;
  }
}
export function createUser(
  name: string,
  email: string,
  password: string,
  role: "admin" | "editor",
) {
  if (password.length < 12 || password.length > 256)
    throw new Error("La contraseña debe tener entre 12 y 256 caracteres.");
  if (
    !name.trim() ||
    name.length > 100 ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    email.length > 200
  )
    throw new Error("Revisá el nombre y el correo.");
  const db = database();
  const id = randomUUID();
  db.prepare(
    "INSERT INTO users(id,name,email,password_hash,role)VALUES(?,?,?,?,?)",
  ).run(
    id,
    name.trim(),
    email.trim().toLowerCase(),
    passwordHash(password),
    role,
  );
  return id;
}
export function readContent(
  which: "published" | "draft" = "published",
): Content {
  const r = database()
    .prepare("SELECT json FROM documents WHERE key=?")
    .get(which) as Row;
  return JSON.parse(r.json);
}
export function saveDraft(input: unknown, expected: string, author: string) {
  const parsed = validateContent(input);
  const db = database();
  db.exec("BEGIN IMMEDIATE");
  try {
    const r = db
      .prepare("SELECT revision FROM documents WHERE key=?")
      .get("draft") as Row;
    if (r.revision !== expected)
      throw new Error(
        "CONFLICT: Otra persona guardó cambios. Recargá el panel antes de continuar.",
      );
    parsed.revision = randomUUID();
    db.prepare("UPDATE documents SET json=?,revision=? WHERE key=?").run(
      JSON.stringify(parsed),
      parsed.revision,
      "draft",
    );
    audit("Guardó un borrador", author);
    db.exec("COMMIT");
    return parsed;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function publish(expected: string, author: string) {
  const db = database();
  db.exec("BEGIN IMMEDIATE");
  try {
    const draft = readContent("draft");
    if (draft.revision !== expected)
      throw new Error(
        "CONFLICT: El borrador cambió. Recargá antes de publicar.",
      );
    validateContent(draft);
    const previous = readContent();
    db.prepare(
      "INSERT INTO versions(id,json,created,author)VALUES(?,?,?,?)",
    ).run(
      randomUUID(),
      JSON.stringify(previous),
      new Date().toISOString(),
      author,
    );
    db.prepare("UPDATE documents SET json=?,revision=? WHERE key=?").run(
      JSON.stringify(draft),
      draft.revision,
      "published",
    );
    audit("Publicó los cambios en la web", author);
    db.exec("COMMIT");
    return draft;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function restoreVersion(id: string, expected: string, author: string) {
  const row = database()
    .prepare("SELECT json FROM versions WHERE id=?")
    .get(id) as { json: string } | undefined;
  if (!row) throw new Error("No se encontró esa versión.");
  return saveDraft(JSON.parse(row.json), expected, author);
}
export function audit(action: string, author: string) {
  database()
    .prepare("INSERT INTO audit(id,action,author,created)VALUES(?,?,?,?)")
    .run(randomUUID(), action, author, new Date().toISOString());
}
export function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: !!user.active,
  };
}
export function users() {
  return database()
    .prepare("SELECT id,name,email,role,active FROM users ORDER BY name")
    .all()
    .map((u) => publicUser(u as User));
}
export function login(email: string, password: string) {
  const user = database()
    .prepare("SELECT * FROM users WHERE email=? AND active=1")
    .get(email.trim().toLowerCase()) as User | undefined;
  const dummy = "00000000000000000000000000000000:" + "0".repeat(128);
  if (!passwordMatches(password, user?.password_hash || dummy) || !user)
    return null;
  return publicUser(user);
}
export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const db = database();
  db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
  db.prepare(
    "INSERT INTO sessions(token_hash,user_id,expires)VALUES(?,?,?)",
  ).run(tokenHash(token), userId, Date.now() + 12 * 60 * 60 * 1000);
  return token;
}
export function sessionUser(token: string | undefined) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const user = database()
    .prepare(
      "SELECT u.id,u.name,u.email,u.role,u.active FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token_hash=? AND s.expires>? AND u.active=1",
    )
    .get(tokenHash(token), Date.now()) as User | undefined;
  return user ? publicUser(user) : null;
}
export function logout(token: string | undefined) {
  if (token)
    database()
      .prepare("DELETE FROM sessions WHERE token_hash=?")
      .run(tokenHash(token));
}
export function changePassword(userId: string, password: string) {
  if (password.length < 12 || password.length > 256)
    throw new Error("La contraseña debe tener entre 12 y 256 caracteres.");
  database()
    .prepare("UPDATE users SET password_hash=? WHERE id=?")
    .run(passwordHash(password), userId);
  database().prepare("DELETE FROM sessions WHERE user_id=?").run(userId);
}
