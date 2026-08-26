import { useEffect, useState } from 'react';
import { ProveedorCoban } from '@/dominio/tienda';
import { Punto1 } from '@/puntos/Punto1';
import { Punto2 } from '@/puntos/Punto2';
import { Punto3 } from '@/puntos/Punto3';
import { Punto4 } from '@/puntos/Punto4';
import { Punto5 } from '@/puntos/Punto5';
import { Punto6 } from '@/puntos/Punto6';
import { Punto7 } from '@/puntos/Punto7';
import { Punto8 } from '@/puntos/Punto8';
import estilos from './App.module.css';

const VERSION_ESTATICA = 'v1.0 · 26 ago 2026';

interface DefinicionPunto {
  n: number;
  etiqueta: string;
  Componente: () => JSX.Element;
}

const PUNTOS: DefinicionPunto[] = [
  { n: 1, etiqueta: 'Rol SuperAdmin', Componente: Punto1 },
  { n: 2, etiqueta: 'Rol Admin', Componente: Punto2 },
  { n: 3, etiqueta: 'Rol Cajero', Componente: Punto3 },
  { n: 4, etiqueta: 'Terceros (A)', Componente: Punto4 },
  { n: 5, etiqueta: 'Terceros (B)', Componente: Punto5 },
  { n: 6, etiqueta: 'Reportes SuperAdmin', Componente: Punto6 },
  { n: 7, etiqueta: 'Reportes Admin', Componente: Punto7 },
  { n: 8, etiqueta: 'Reportes Cajero', Componente: Punto8 },
];

/** Lee el punto activo del hash de la URL (`#/punto-3`); si falla o no hay match, usa el punto 1. */
function leerPuntoDesdeHash(): number {
  try {
    const coincidencia = window.location.hash.match(/punto-(\d+)/);
    if (coincidencia) {
      const n = Number(coincidencia[1]);
      if (n >= 1 && n <= PUNTOS.length) return n;
    }
  } catch {
    // window/location no disponible (SSR, entorno restringido) — usar default.
  }
  return 1;
}

/** Escribe el punto activo en el hash, sin romper si el entorno no lo permite. */
function escribirPuntoEnHash(n: number) {
  try {
    window.location.hash = `/punto-${n}`;
  } catch {
    // no-op
  }
}

export function App() {
  const [puntoActivo, setPuntoActivo] = useState<number>(() => leerPuntoDesdeHash());

  // Sincroniza el estado si el usuario navega con atrás/adelante o edita el hash a mano.
  useEffect(() => {
    function manejarCambioHash() {
      setPuntoActivo(leerPuntoDesdeHash());
    }
    try {
      window.addEventListener('hashchange', manejarCambioHash);
      return () => window.removeEventListener('hashchange', manejarCambioHash);
    } catch {
      return undefined;
    }
  }, []);

  function seleccionarPunto(n: number) {
    setPuntoActivo(n);
    escribirPuntoEnHash(n);
  }

  const PuntoActivoComponente = PUNTOS.find((p) => p.n === puntoActivo)?.Componente ?? Punto1;

  return (
    <ProveedorCoban>
      <header className={estilos.cabecera}>
        <div className={estilos.cabeceraContenido}>
          <div>
            <h1 className={estilos.titulo}>Coban365 · Demo</h1>
            <p className={estilos.subtitulo}>Simulador de corresponsalía bancaria</p>
          </div>
          <span className={estilos.version}>{VERSION_ESTATICA}</span>
        </div>
      </header>
      <div className={estilos.wrap}>
        <nav className={estilos.tabs}>
          {PUNTOS.map((punto) => (
            <button
              key={punto.n}
              type="button"
              className={[estilos.tabBtn, punto.n === puntoActivo ? estilos.tabBtnActivo : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => seleccionarPunto(punto.n)}
            >
              <span className={estilos.n}>{punto.n}</span>
              {punto.etiqueta}
            </button>
          ))}
        </nav>
        <PuntoActivoComponente />
      </div>
    </ProveedorCoban>
  );
}
