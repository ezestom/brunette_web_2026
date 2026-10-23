import { useEffect, useRef, useState } from "react";
import { sileo } from "sileo";
import {
  ContactActivationRequiredError,
  sendContactMessage,
} from "../lib/contact";

export default function ContactForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const redirect = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (redirect.current) clearTimeout(redirect.current);
    },
    [],
  );

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (field: string) => String(data.get(field) || "").trim();
    if (!value("firstName") || !value("email") || !value("message")) {
      setError("Completá tu nombre, email y mensaje antes de enviar.");
      return;
    }
    setBusy(true);
    setError("");
    sileo.clear("top-center");
    try {
      await sendContactMessage(
        {
          firstName: value("firstName"),
          lastName: value("lastName"),
          phone: value("phone"),
          email: value("email"),
          message: value("message"),
        },
        fetch,
        new URL("/", window.location.href).href,
        import.meta.env.PUBLIC_FORMSUBMIT_FORM_ID,
      );
      form.reset();
      setSent(true);
      sileo.success({
        title: "¡Mensaje enviado!",
        description: "Gracias por escribirnos. Te responderemos por email.",
        duration: 4500,
      });
      redirect.current = setTimeout(() => window.location.assign("/"), 1800);
    } catch (error) {
      const activationPending = error instanceof ContactActivationRequiredError;
      const message = activationPending
        ? error.message
        : "No pudimos enviar tu mensaje. Tus datos se conservaron; intentá nuevamente.";
      setError(message);
      setBusy(false);
      const notify = activationPending ? sileo.warning : sileo.error;
      notify({
        title: activationPending
          ? "Falta activar el formulario"
          : "No se pudo enviar",
        description: message,
        duration: 6000,
      });
    }
  }
  function ripple(event: React.MouseEvent<HTMLElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--mouse-x",
      `${event.clientX - box.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--mouse-y",
      `${event.clientY - box.top}px`,
    );
  }
  return (
    <form
      className="Contact_Form"
      onSubmit={submit}
      onChange={() => setError("")}
    >
      <div className="Form_Field">
        <label className="sr-only" htmlFor="contact-first-name">
          Nombre
        </label>
        <input
          id="contact-first-name"
          name="firstName"
          placeholder="Nombre"
          autoComplete="given-name"
          maxLength={80}
          required
          disabled={busy}
        />
      </div>
      <div className="Form_Field">
        <label className="sr-only" htmlFor="contact-last-name">
          Apellido
        </label>
        <input
          id="contact-last-name"
          name="lastName"
          placeholder="Apellido"
          autoComplete="family-name"
          maxLength={80}
          disabled={busy}
        />
      </div>
      <div className="Form_Field">
        <label className="sr-only" htmlFor="contact-phone">
          Teléfono
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          placeholder="Teléfono"
          autoComplete="tel"
          maxLength={40}
          disabled={busy}
        />
      </div>
      <div className="Form_Field">
        <label className="sr-only" htmlFor="contact-email">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          maxLength={200}
          required
          disabled={busy}
        />
      </div>
      <div className="Form_Area">
        <label className="sr-only" htmlFor="contact-message">
          Contanos qué necesitás
        </label>
        <textarea
          id="contact-message"
          name="message"
          placeholder="Contanos qué necesitás"
          maxLength={2000}
          required
          rows={8}
          disabled={busy}
        />
      </div>

      {error && (
        <p className="form-alert contact-alert" role="alert">
          {error}
        </p>
      )}

      <div className="Form_Zone">
        <div
          className="Form_Button Form__Submit Relative_To_Mouse"
          onMouseEnter={ripple}
          onMouseLeave={ripple}
        >
          <button type="submit" disabled={busy}>
            {sent
              ? "Mensaje enviado"
              : busy
                ? "Enviando mensaje..."
                : "Enviar mensaje"}
          </button>
        </div>
      </div>
    </form>
  );
}
