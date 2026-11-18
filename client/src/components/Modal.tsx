import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ title, onClose, children, wide = false }: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className={`modal-card${wide ? " modal-card-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <div><span className="eyebrow">CONTROLE DE ESTOQUE</span><h2>{title}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar janela"><X size={19} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}
