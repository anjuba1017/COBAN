import type { ReactNode } from 'react';
import estilos from './EstadoVacio.module.css';

export interface EstadoVacioProps {
  children: ReactNode;
}

/** La `.empty-log` del original: mensaje centrado con borde punteado. */
export function EstadoVacio({ children }: EstadoVacioProps) {
  return <div className={estilos.vacio}>{children}</div>;
}
