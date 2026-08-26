import type { ReactNode } from 'react';
import estilos from './Aviso.module.css';

export type VarianteAviso = 'info' | 'advertencia' | 'exito' | 'error';

export interface AvisoProps {
  variante?: VarianteAviso;
  children: ReactNode;
  className?: string;
}

/** La `.note-box` del original (por defecto ámbar, con variante `.info` en azul). */
export function Aviso({ variante = 'advertencia', children, className }: AvisoProps) {
  return (
    <div className={[estilos.caja, estilos[variante], className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
