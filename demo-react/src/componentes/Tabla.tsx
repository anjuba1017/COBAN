import type { ReactNode } from 'react';
import estilos from './Tabla.module.css';

export interface ColumnaTabla<T> {
  clave: string;
  titulo: string;
  alineacion?: 'izquierda' | 'centro' | 'derecha';
  render?: (fila: T) => ReactNode;
}

export interface TablaProps<T> {
  columnas: ColumnaTabla<T>[];
  filas: T[];
  /** Extrae una key de React estable por fila; por defecto usa el índice. */
  obtenerId?: (fila: T, indice: number) => string | number;
  vacio?: ReactNode;
}

/** Tabla genérica tipada, envuelta en un contenedor con scroll horizontal propio. */
export function Tabla<T>({ columnas, filas, obtenerId, vacio }: TablaProps<T>) {
  if (filas.length === 0 && vacio !== undefined) {
    return <>{vacio}</>;
  }

  return (
    <div className={estilos.contenedor}>
      <table className={estilos.tabla}>
        <thead>
          <tr>
            {columnas.map((columna) => (
              <th key={columna.clave} className={estilos[columna.alineacion ?? 'izquierda']}>
                {columna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, indice) => (
            <tr key={obtenerId ? obtenerId(fila, indice) : indice}>
              {columnas.map((columna) => (
                <td key={columna.clave} className={estilos[columna.alineacion ?? 'izquierda']}>
                  {columna.render
                    ? columna.render(fila)
                    : String((fila as Record<string, unknown>)[columna.clave] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
