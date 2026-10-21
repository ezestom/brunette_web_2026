import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
process.env.BRUNETTE_DATA_DIR = mkdtempSync(
  join(tmpdir(), "brunette-cms-test-"),
);
const store = await import("../src/lib/db.ts");
const { validateContent } = await import("../src/lib/validation.ts");
const db = store.database();
after(() => db.close());
test("draft edits do not affect the published website and conflicts do not overwrite", () => {
  const draft = store.readContent("draft");
  const old = store.readContent();
  const first = structuredClone(draft);
  first.home.heroTitle = "Prueba de borrador";
  const saved = store.saveDraft(first, draft.revision, "Prueba");
  assert.equal(store.readContent().home.heroTitle, old.home.heroTitle);
  assert.throws(
    () => store.saveDraft(draft, draft.revision, "Otro editor"),
    /CONFLICT/,
  );
  store.publish(saved.revision, "Prueba");
  assert.equal(store.readContent().home.heroTitle, "Prueba de borrador");
  const snapshot = db
    .prepare("SELECT id FROM versions ORDER BY created DESC LIMIT 1")
    .get();
  const restored = store.restoreVersion(snapshot.id, saved.revision, "Prueba");
  assert.equal(restored.home.heroTitle, old.home.heroTitle);
  assert.equal(store.readContent().home.heroTitle, "Prueba de borrador");
});
test("passwords are hashed and sessions expire or are revoked on password change", () => {
  const id = store.createUser(
    "Equipo",
    "equipo@test.local",
    "contraseña-de-prueba-aleatoria",
    "editor",
  );
  const row = db.prepare("SELECT password_hash FROM users WHERE id=?").get(id);
  assert.notEqual(row.password_hash, "contraseña-de-prueba-aleatoria");
  assert.equal(store.login("equipo@test.local", "incorrecta"), null);
  assert.equal(
    store.login("equipo@test.local", "contraseña-de-prueba-aleatoria").role,
    "editor",
  );
  const token = store.createSession(id);
  assert.equal(store.sessionUser(token).id, id);
  store.changePassword(id, "otra-contraseña-de-prueba-segura");
  assert.equal(store.sessionUser(token), null);
});
test("rejects negative prices, unsafe image paths and accidental live demo publication", () => {
  const sample = store.readContent("draft");
  const invalid = structuredClone(sample);
  invalid.products[0].variants[0].price = -1;
  assert.throws(() => validateContent(invalid));
  const unsafe = structuredClone(sample);
  unsafe.home.heroImage = "javascript:alert(1)";
  assert.throws(() => validateContent(unsafe));
  const live = structuredClone(sample);
  live.home.previewMode = false;
  assert.throws(() => validateContent(live), /prueba/);
});
test("existing content receives contact defaults and contact changes publish through the CMS", () => {
  const legacy = structuredClone(store.readContent("draft"));
  delete legacy.home.contactTitle;
  delete legacy.home.contactText;
  delete legacy.home.contactImage;
  const parsed = validateContent(legacy);
  assert.equal(parsed.home.contactTitle, "Contactanos");
  assert.equal(
    parsed.home.contactImage,
    "/assets/Two_Food_Photograhers-74100a5d.jpg",
  );
  parsed.home.contactTitle = "Hablemos de tu próximo antojo";
  parsed.home.contactImage = "/assets/brunette-logo.webp";
  const saved = store.saveDraft(parsed, legacy.revision, "Prueba de contacto");
  store.publish(saved.revision, "Prueba de contacto");
  assert.equal(store.readContent().home.contactTitle, parsed.home.contactTitle);
  assert.equal(store.readContent().home.contactImage, parsed.home.contactImage);
  const unsafe = structuredClone(parsed);
  unsafe.home.contactImage = "javascript:alert(1)";
  assert.throws(() => validateContent(unsafe));
});
