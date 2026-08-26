import type { ReactNode } from 'react';
import estilos from './FilaKV.module.css';

export interface FilaKVProps {
  etiqueta: ReactNode;
  valor: ReactNode;
  className?: string;
}

/** La `.kv` del original: etiqueta a la izquierda, valor en negrita a la derecha. */
export function FilaKV({ etiqueta, valor, className }: FilaKVProps) {
  return (
    <div className={[estilos.kv, className].filter(Boolean).join(' ')}>
      <span className={estilos.etiqueta}>{etiqueta}</span>
      <span className={estilos.valor}>{valor}</span>
    </div>
  );
}
