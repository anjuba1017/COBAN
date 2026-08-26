import type { ReactNode } from 'react';
import estilos from './Etiqueta.module.css';

export type VarianteEtiqueta = 'verde' | 'rojo' | 'ambar' | 'azul' | 'acento' | 'neutro';

export interface EtiquetaProps {
  variante?: VarianteEtiqueta;
  children: ReactNode;
  className?: string;
}

/** Chip/badge del original (`.badge`, `.badge-green`, etc.), con variantes ampliadas. */
export function Etiqueta({ variante = 'neutro', children, className }: EtiquetaProps) {
  return (
    <span className={[estilos.badge, estilos[variante], className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}
