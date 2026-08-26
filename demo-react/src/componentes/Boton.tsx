import type { ButtonHTMLAttributes, ReactNode } from 'react';
import estilos from './Boton.module.css';

export type VarianteBoton = 'primario' | 'fantasma' | 'peligro';
export type TamanoBoton = 'normal' | 'pequeno';

export interface BotonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  children: ReactNode;
  className?: string;
}

/** Botón del original (`.btn-primary`, `.btn-ghost`, `.btn-small`). */
export function Boton({
  variante = 'primario',
  tamano = 'normal',
  children,
  className,
  ...resto
}: BotonProps) {
  return (
    <button
      className={[estilos.btn, estilos[variante], estilos[tamano], className]
        .filter(Boolean)
        .join(' ')}
      {...resto}
    >
      {children}
    </button>
  );
}
