import type { ReactNode } from 'react';
import estilos from './PanelAviso.module.css';

export type TipoPanelAviso = 'exito' | 'error';

export interface PanelAvisoProps {
  tipo: TipoPanelAviso;
  children: ReactNode;
  onCerrar?: () => void;
}

/** Banner de resultado de una operación (reemplaza los `alert()` del original). */
export function PanelAviso({ tipo, children, onCerrar }: PanelAvisoProps) {
  return (
    <div className={[estilos.panel, estilos[tipo]].join(' ')} role="status">
      <span className={estilos.icono}>{tipo === 'exito' ? '✓' : '✕'}</span>
      <div className={estilos.mensaje}>{children}</div>
      {onCerrar !== undefined && (
        <button type="button" className={estilos.cerrar} onClick={onCerrar} aria-label="Cerrar aviso">
          ✕
        </button>
      )}
    </div>
  );
}
