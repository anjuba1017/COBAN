import type { ReactNode } from 'react';
import estilos from './Tarjeta.module.css';

export interface TarjetaProps {
  /** Título opcional del encabezado (h2). */
  titulo?: ReactNode;
  /** Texto de chip mostrado junto al título, p. ej. "Nuevo". */
  etiqueta?: string;
  children: ReactNode;
  className?: string;
}

/** La `.card` del HTML original: contenedor blanco con borde y sombra suave. */
export function Tarjeta({ titulo, etiqueta, children, className }: TarjetaProps) {
  return (
    <div className={[estilos.card, className].filter(Boolean).join(' ')}>
      {titulo !== undefined && (
        <h2 className={estilos.titulo}>
          {titulo}
          {etiqueta !== undefined && <span className={estilos.etiqueta}>{etiqueta}</span>}
        </h2>
      )}
      {children}
    </div>
  );
}
