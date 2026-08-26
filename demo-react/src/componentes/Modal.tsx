import { useEffect, useRef, type ReactNode } from 'react';
import estilos from './Modal.module.css';

export interface ModalProps {
  titulo: string;
  abierto: boolean;
  onCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
}

const SELECTOR_FOCUSABLES =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Overlay + panel centrado con cabecera navy. Cierra con Escape o click fuera. */
export function Modal({ titulo, abierto, onCerrar, children, pie }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Bloquea el scroll del body mientras el modal está abierto.
  useEffect(() => {
    if (!abierto) return;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto]);

  // Cierre con Escape + trampa de foco dentro del panel.
  useEffect(() => {
    if (!abierto) return;

    function manejarTeclado(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        onCerrar();
        return;
      }
      if (evento.key !== 'Tab' || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(SELECTOR_FOCUSABLES);
      if (focusables.length === 0) return;
      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener('keydown', manejarTeclado);
    // Foco inicial dentro del panel.
    const primerFocusable = panelRef.current?.querySelector<HTMLElement>(SELECTOR_FOCUSABLES);
    primerFocusable?.focus();

    return () => document.removeEventListener('keydown', manejarTeclado);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className={estilos.overlay}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar();
      }}
    >
      <div
        ref={panelRef}
        className={estilos.panel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <div className={estilos.cabecera}>
          <span>{titulo}</span>
          <button type="button" className={estilos.cerrar} onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className={estilos.cuerpo}>{children}</div>
        {pie !== undefined && <div className={estilos.pie}>{pie}</div>}
      </div>
    </div>
  );
}
