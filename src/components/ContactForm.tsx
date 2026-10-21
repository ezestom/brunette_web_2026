import { useEffect, useState } from "react";
import WhatsAppMessage from "./WhatsAppMessage";

export default function ContactForm({
  businessName,
  whatsapp,
}: {
  businessName: string;
  whatsapp: string;
}) {
  const [prepared, setPrepared] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    document.dispatchEvent(new Event("brunette:motion-refresh"));
  }, [prepared, error]);
  function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const number = whatsapp.replace(/\D/g, "");
    if (!/^\d{8,15}$/.test(number)) {
      setError("El contacto por WhatsApp todavía no está configurado.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const value = (field: string) => String(data.get(field) || "").trim();
    const firstName = value("firstName"),
      message = value("message");
    if (!firstName || !message) {
      setError("Completá tu nombre y contanos qué necesitás.");
      return;
    }
    const text = [
      `¡Hola ${businessName}! Quiero hacer una consulta:`,
      "",
      message,
      "",
      `Nombre: ${[firstName, value("lastName")].filter(Boolean).join(" ")}`,
      ...(value("phone") ? [`Teléfono: ${value("phone")}`] : []),
      ...(value("email") ? [`Email: ${value("email")}`] : []),
    ].join("\n");
    setPrepared(`https://wa.me/${number}?text=${encodeURIComponent(text)}`);
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
      onChange={() => {
        setPrepared("");
        setError("");
      }}
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
        />
      </div>
      {error && (
        <p className="form-alert contact-alert" role="alert">
          {error}
        </p>
      )}
      {prepared ? (
        <div className="contact-ready">
          <WhatsAppMessage
            url={prepared}
            linkText="Abrir WhatsApp para enviar la consulta"
          />
        </div>
      ) : (
        <div className="Form_Zone">
          <div
            className="Form_Button Form__Submit Relative_To_Mouse"
            onMouseEnter={ripple}
            onMouseLeave={ripple}
          >
            <button type="submit">Preparar mensaje</button>
          </div>
        </div>
      )}
    </form>
  );
}
