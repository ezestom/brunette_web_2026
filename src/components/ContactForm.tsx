import { useEffect, useState } from "react";
import { Toaster, sileo } from "sileo";
import "sileo/styles.css";
import WhatsAppMessage from "./WhatsAppMessage";

export default function ContactForm({
  businessName,
  whatsapp,
}: {
  businessName: string;
  whatsapp: string;
}) {
  const [prepared, setPrepared] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false);

  useEffect(() => {
    document.dispatchEvent(new Event("brunette:motion-refresh"));
  }, [prepared, error, sent]);

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (field: string) => String(data.get(field) || "").trim();
    const firstName = value("firstName"),
      lastName = value("lastName"),
      phone = value("phone"),
      email = value("email"),
      message = value("message");

    if (!firstName || !message) {
      setError("Completá tu nombre y contanos qué necesitás antes de enviar.");
      sileo.warning({
        title: "Campos incompletos",
        description: "Completá tu nombre y el mensaje antes de enviar.",
        duration: 5000,
      });
      return;
    }

    setBusy(true);

    // Prepare WhatsApp fallback link just in case
    const number = whatsapp.replace(/\D/g, "");
    if (/^\d{8,15}$/.test(number)) {
      const text = [
        `¡Hola ${businessName}! Quiero hacer una consulta:`,
        "",
        message,
        "",
        `Nombre: ${[firstName, lastName].filter(Boolean).join(" ")}`,
        ...(phone ? [`Teléfono: ${phone}`] : []),
        ...(email ? [`Email: ${email}`] : []),
      ].join("\n");
      setPrepared(`https://wa.me/${number}?text=${encodeURIComponent(text)}`);
    }

    try {
      const payload = {
        name: [firstName, lastName].filter(Boolean).join(" "),
        email: email || "No especificado",
        phone: phone || "No especificado",
        message: message,
        _subject: `Nuevo mensaje de contacto web Brunette - ${firstName}`,
        _template: "table",
        _captcha: "false",
      };

      const res = await fetch(
        "https://formsubmit.co/ajax/ezequielstom@gmail.com",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await res.json().catch(() => ({}));

      if (
        res.ok ||
        result.success === "true" ||
        result.success === true ||
        (result.message && String(result.message).includes("Activation"))
      ) {
        setSent(true);
        form.reset();
        sileo.success({
          title: "¡Mensaje enviado con éxito!",
          description:
            "Tu consulta fue enviada a ezequielstom@gmail.com. Te responderemos a la brevedad.",
          duration: 7000,
        });
      } else {
        throw new Error(result.message || "Error al enviar formulario");
      }
    } catch (err) {
      console.error(err);
      sileo.error({
        title: "Error al enviar el correo",
        description:
          "No se pudo enviar el correo directo. Podés enviarnos tu consulta por WhatsApp.",
        duration: 7000,
      });
      setError(
        "No se pudo enviar por correo directo. Usá el botón de WhatsApp a continuación para enviarlo directo.",
      );
    } finally {
      setBusy(false);
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
    <>
      <Toaster position="top-center" theme="light" />

      {sent ? (
        <div className="contact-success-state">
          <div className="contact-success-badge-row">
            <div className="contact-success-icon">✳</div>
            <span className="contact-success-badge">
              Consulta enviada con éxito
            </span>
          </div>
          <h2 className="contact-success-title">
            ¡Muchas gracias por comunicarte!
          </h2>
          <p className="contact-success-description">
            Recibimos tu mensaje correctamente. Nuestro equipo lo revisará y te
            responderá a la brevedad.
          </p>
          <div className="contact-success-chip">
            <span>
              ✉ Destinatario: <strong>ezequielstom@gmail.com</strong>
            </span>
          </div>
          <div className="contact-success-actions">
            <button
              type="button"
              className="contact-success-reset-btn"
              onClick={() => {
                setSent(false);
                setPrepared("");
                setError("");
              }}
            >
              <span>Enviar otra consulta</span>
              <span aria-hidden="true">↺</span>
            </button>
            {prepared && (
              <a
                href={prepared}
                target="_blank"
                rel="noreferrer"
                className="contact-success-wa-link"
              >
                <span>¿Es urgente? Escribinos por WhatsApp</span>
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </div>
      ) : (
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

          {error && prepared && (
            <div className="contact-ready" style={{ marginTop: "1rem" }}>
              <WhatsAppMessage
                url={prepared}
                linkText="Enviar consulta por WhatsApp"
              />
            </div>
          )}

          <div className="Form_Zone">
            <div
              className="Form_Button Form__Submit Relative_To_Mouse"
              onMouseEnter={ripple}
              onMouseLeave={ripple}
            >
              <button type="submit" disabled={busy}>
                {busy ? "Enviando mensaje..." : "Enviar mensaje"}
              </button>
            </div>
          </div>
        </form>
      )}
    </>
  );
}
