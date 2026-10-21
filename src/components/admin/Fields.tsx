import { useEffect, useState } from "react";
import type { OpeningDay } from "../../lib/types";
export function Field({
  label,
  help,
  children,
}: {
  label: string;
  help: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-field">
      <div className="admin-field-label">{label}</div>
      {children}
      <p className="admin-help">{help}</p>
    </div>
  );
}
export function TextField({
  label,
  help,
  value,
  onChange,
  area = false,
  type = "text",
}: {
  label: string;
  help: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
  type?: string;
}) {
  return (
    <label className="admin-field">
      <span className="admin-field-label">{label}</span>
      {area ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      <span className="admin-help">{help}</span>
    </label>
  );
}
export function NumberField({
  label,
  help,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  help: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
}) {
  return (
    <label className="admin-field">
      <span className="admin-field-label">{label}</span>
      <input
        type="number"
        min={min}
        value={value ?? ""}
        step="1"
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
      />
      <span className="admin-help">{help}</span>
    </label>
  );
}
export function ListField({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [raw, setRaw] = useState(value.join(", "));
  const signature = value.join("|");
  useEffect(() => setRaw(value.join(", ")), [signature]);
  return (
    <label className="admin-field">
      <span className="admin-field-label">{label}</span>
      <input
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={() =>
          onChange(
            raw
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
          )
        }
      />
      <span className="admin-help">{help}</span>
    </label>
  );
}
export function MoneyField({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="admin-field">
      <span className="admin-field-label">{label}</span>
      <div className="money-input">
        <span>$</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value === null ? "" : value / 100}
          onChange={(e) =>
            onChange(
              e.target.value === ""
                ? null
                : Math.round(Number(e.target.value) * 100),
            )
          }
        />
      </div>
      <span className="admin-help">{help}</span>
    </label>
  );
}
export function Toggle({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="admin-toggle">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <strong>{label}</strong>
        <small>{help}</small>
      </span>
    </label>
  );
}
export function ImageField({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      onChange(result.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Field label={label} help={help}>
      <div className="image-field">
        {value ? (
          <img src={value} alt={"Vista previa: " + label} />
        ) : (
          <div className="image-placeholder">Sin imagen</div>
        )}
        <div>
          <label className="admin-button secondary upload-button">
            {busy ? "Subiendo…" : value ? "Cambiar foto" : "Elegir una foto"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(e) => {
                upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {value && (
            <button
              className="admin-text-button"
              type="button"
              onClick={() => onChange("")}
            >
              Quitar imagen
            </button>
          )}
          <p className="admin-help">JPG, PNG o WebP · hasta 8 MB</p>
        </div>
      </div>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
    </Field>
  );
}
export function HoursEditor({
  value,
  onChange,
}: {
  value: OpeningDay[];
  onChange: (v: OpeningDay[]) => void;
}) {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const all = days.map(
    (_, day) =>
      value.find((h) => h.day === day) || {
        day,
        closed: true,
        open: "09:00",
        close: "19:00",
      },
  );
  function update(day: number, patch: Partial<OpeningDay>) {
    onChange(all.map((h) => (h.day === day ? { ...h, ...patch } : h)));
  }
  return (
    <Field
      label="Horarios de atención"
      help="Activá los días que abre esta sucursal y cargá apertura y cierre. El cliente no podrá pedir para un día cerrado ni fuera de este horario."
    >
      <div className="hours-editor">
        {all.map((h) => (
          <div key={h.day}>
            <label>
              <input
                type="checkbox"
                checked={!h.closed}
                onChange={(e) => update(h.day, { closed: !e.target.checked })}
              />
              <span>{days[h.day]}</span>
            </label>
            <input
              type="time"
              aria-label={"Apertura del " + days[h.day]}
              value={h.open}
              disabled={h.closed}
              onChange={(e) => update(h.day, { open: e.target.value })}
            />
            <span>—</span>
            <input
              type="time"
              aria-label={"Cierre del " + days[h.day]}
              value={h.close}
              disabled={h.closed}
              onChange={(e) => update(h.day, { close: e.target.value })}
            />
          </div>
        ))}
      </div>
    </Field>
  );
}
