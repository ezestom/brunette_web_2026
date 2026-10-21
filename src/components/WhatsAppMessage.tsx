import { useEffect, useId, useState } from "react";
import { ArrowIcon } from "./Icons";

export default function WhatsAppMessage({
  url,
  title = "Tu mensaje está listo.",
  linkText = "Abrir WhatsApp para enviar",
}: {
  url: string;
  title?: string;
  linkText?: string;
}) {
  const id = useId(),
    [copied, setCopied] = useState(false),
    [copyError, setCopyError] = useState(false);
  const message = new URL(url).searchParams.get("text") || "";
  useEffect(() => {
    setCopied(false);
    setCopyError(false);
    document.dispatchEvent(new Event("brunette:motion-refresh"));
  }, [url]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  return (
    <div className="whatsapp-ready">
      <p role="status">{title} Revisalo y abrí WhatsApp para enviarlo.</p>
      <label htmlFor={id}>Mensaje preparado</label>
      <textarea
        id={id}
        className="whatsapp-message"
        aria-label="Mensaje preparado para WhatsApp"
        value={message}
        readOnly
        rows={9}
      />
      <button
        type="button"
        className="text-button whatsapp-copy"
        onClick={copy}
      >
        {copied ? "Mensaje copiado ✓" : "Copiar mensaje"}
      </button>
      {copyError && (
        <p role="status">Podés seleccionar el texto del mensaje y copiarlo.</p>
      )}
      <a
        className="pill primary full"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        {linkText}
        <ArrowIcon />
      </a>
    </div>
  );
}
