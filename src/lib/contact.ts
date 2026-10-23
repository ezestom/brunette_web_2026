export interface ContactMessage {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
}

export class ContactActivationRequiredError extends Error {
  constructor() {
    super(
      "Falta activar el formulario. Abrí el correo de FormSubmit y confirmá «Activate Form». Después volvé a enviar tu consulta; tus datos se conservaron.",
    );
    this.name = "ContactActivationRequiredError";
  }
}

export async function sendContactMessage(
  fields: ContactMessage,
  request: typeof fetch = fetch,
  sourceUrl?: string,
  formId?: string,
) {
  const recipient = formId?.trim()
    ? encodeURIComponent(formId.trim())
    : "ezequielstom@gmail.com";
  const response = await request(`https://formsubmit.co/ajax/${recipient}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      name: [fields.firstName, fields.lastName].filter(Boolean).join(" "),
      email: fields.email,
      phone: fields.phone || "No especificado",
      message: fields.message,
      _subject: `Nuevo mensaje de contacto web Brunette - ${fields.firstName}`,
      _template: "table",
      _captcha: "false",
      // Keep the site identity explicit even when a browser strips Referer.
      _url: sourceUrl,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (/activat/i.test(String(result.message || ""))) {
    throw new ContactActivationRequiredError();
  }
  // A 200 response or a mailbox activation request does not confirm submission.
  if (!response.ok || ![true, "true"].includes(result.success)) {
    throw new Error(
      "No pudimos confirmar el envío. Tus datos se conservaron; intentá nuevamente.",
    );
  }
}
