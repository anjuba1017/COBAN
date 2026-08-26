/**
 * Estado compartido de toda la app: un único store para los 8 puntos/pantallas.
 * Cualquier movimiento registrado en un punto se refleja de inmediato en los
 * reportes de los demás, porque todos leen del mismo Context.
 */

import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import type { Cajero, CierreCaja, Corresponsal, Movimiento, Tercero } from './tipos';
import {
  CAJA_INICIAL,
  CAJEROS_SEMILLA,
  CORRESPONSALES_SEMILLA,
  DEUDA_INICIAL,
  TERCEROS_SEMILLA,
} from './semilla';
import {
  registrarMovimientoCaja,
  registrarPrestamoTercero,
  retirarComision as retirarComisionOp,
  type ArgsMovimientoCaja,
  type ArgsPrestamoTercero,
  type EstadoFinanciero,
  type ResultadoOperacion,
} from './operaciones';
import { cupoDisponibleCB, netoTercero } from './calculos';

export interface EstadoCoban extends EstadoFinanciero {
  cierres: CierreCaja[];
  cajeros: Cajero[];
  corresponsales: Corresponsal[];
}

function estadoInicial(): EstadoCoban {
  return {
    caja: CAJA_INICIAL,
    deuda: DEUDA_INICIAL,
    terceros: TERCEROS_SEMILLA,
    movimientos: [],
    contador: 0,
    cierres: [],
    cajeros: CAJEROS_SEMILLA,
    corresponsales: CORRESPONSALES_SEMILLA,
  };
}

type Accion =
  | { tipo: 'APLICAR_FINANCIERO'; estado: EstadoFinanciero }
  | { tipo: 'CREAR_TERCERO'; tercero: Tercero }
  | { tipo: 'ACTUALIZAR_TERCERO'; terceroId: number; cambios: Partial<Tercero> }
  | { tipo: 'ELIMINAR_TERCERO'; terceroId: number }
  | { tipo: 'REGISTRAR_CIERRE'; cierre: CierreCaja }
  | { tipo: 'ACTUALIZAR_CORRESPONSAL'; corresponsalId: number; cambios: Partial<Corresponsal> }
  | { tipo: 'REINICIAR' };

function reducir(estado: EstadoCoban, accion: Accion): EstadoCoban {
  switch (accion.tipo) {
    // El resultado de las operaciones financieras (que pueden fallar) se
    // calcula fuera del reducer, con las funciones puras de operaciones.ts;
    // aquí solo se aplica el estado ya resuelto. Mantiene el reducer puro
    // y evita depender de efectos secundarios dentro de dispatch.
    case 'APLICAR_FINANCIERO':
      return { ...estado, ...accion.estado };
    case 'CREAR_TERCERO':
      return { ...estado, terceros: [...estado.terceros, accion.tercero] };
    case 'ACTUALIZAR_TERCERO':
      return {
        ...estado,
        terceros: estado.terceros.map((t) => (t.id === accion.terceroId ? { ...t, ...accion.cambios } : t)),
      };
    case 'ELIMINAR_TERCERO':
      return { ...estado, terceros: estado.terceros.filter((t) => t.id !== accion.terceroId) };
    case 'REGISTRAR_CIERRE':
      return { ...estado, cierres: [accion.cierre, ...estado.cierres] };
    case 'ACTUALIZAR_CORRESPONSAL':
      return {
        ...estado,
        corresponsales: estado.corresponsales.map((c) =>
          c.id === accion.corresponsalId ? { ...c, ...accion.cambios } : c,
        ),
      };
    case 'REINICIAR':
      return estadoInicial();
    default:
      return estado;
  }
}

export interface ContextoCoban {
  estado: EstadoCoban;
  registrarMovimiento: (args: ArgsMovimientoCaja) => ResultadoOperacion;
  registrarPrestamo: (args: ArgsPrestamoTercero) => ResultadoOperacion;
  retirarComision: (terceroId: number) => ResultadoOperacion;
  crearTercero: (tercero: Tercero) => void;
  actualizarTercero: (terceroId: number, cambios: Partial<Tercero>) => void;
  eliminarTercero: (terceroId: number) => void;
  registrarCierre: (cierre: CierreCaja) => void;
  actualizarCorresponsal: (corresponsalId: number, cambios: Partial<Corresponsal>) => void;
  reiniciar: () => void;
}

const ContextoCobanRef = createContext<ContextoCoban | null>(null);

export function ProveedorCoban({ children }: { children: React.ReactNode }) {
  const [estado, dispatch] = useReducer(reducir, undefined, estadoInicial);

  // Las acciones que pueden fallar (error de validación) se calculan de forma
  // pura contra el estado actual y devuelven el resultado sincrónicamente al
  // llamador, para que la UI muestre el aviso sin recurrir a alert(). Solo si
  // no hay error se despacha el nuevo estado financiero.
  const registrarMovimiento = useCallback(
    (args: ArgsMovimientoCaja): ResultadoOperacion => {
      const resultado = registrarMovimientoCaja(estado, args);
      if (!('error' in resultado)) dispatch({ tipo: 'APLICAR_FINANCIERO', estado: resultado.estado });
      return resultado;
    },
    [estado],
  );

  const registrarPrestamo = useCallback(
    (args: ArgsPrestamoTercero): ResultadoOperacion => {
      const resultado = registrarPrestamoTercero(estado, args);
      if (!('error' in resultado)) dispatch({ tipo: 'APLICAR_FINANCIERO', estado: resultado.estado });
      return resultado;
    },
    [estado],
  );

  const retirarComision = useCallback(
    (terceroId: number): ResultadoOperacion => {
      const resultado = retirarComisionOp(estado, terceroId);
      if (!('error' in resultado)) dispatch({ tipo: 'APLICAR_FINANCIERO', estado: resultado.estado });
      return resultado;
    },
    [estado],
  );

  const crearTercero = useCallback((tercero: Tercero) => dispatch({ tipo: 'CREAR_TERCERO', tercero }), []);

  const actualizarTercero = useCallback(
    (terceroId: number, cambios: Partial<Tercero>) => dispatch({ tipo: 'ACTUALIZAR_TERCERO', terceroId, cambios }),
    [],
  );

  const eliminarTercero = useCallback((terceroId: number) => dispatch({ tipo: 'ELIMINAR_TERCERO', terceroId }), []);

  const registrarCierre = useCallback((cierre: CierreCaja) => dispatch({ tipo: 'REGISTRAR_CIERRE', cierre }), []);

  const actualizarCorresponsal = useCallback(
    (corresponsalId: number, cambios: Partial<Corresponsal>) =>
      dispatch({ tipo: 'ACTUALIZAR_CORRESPONSAL', corresponsalId, cambios }),
    [],
  );

  const reiniciar = useCallback(() => dispatch({ tipo: 'REINICIAR' }), []);

  const valor = useMemo<ContextoCoban>(
    () => ({
      estado,
      registrarMovimiento,
      registrarPrestamo,
      retirarComision,
      crearTercero,
      actualizarTercero,
      eliminarTercero,
      registrarCierre,
      actualizarCorresponsal,
      reiniciar,
    }),
    [
      estado,
      registrarMovimiento,
      registrarPrestamo,
      retirarComision,
      crearTercero,
      actualizarTercero,
      eliminarTercero,
      registrarCierre,
      actualizarCorresponsal,
      reiniciar,
    ],
  );

  return <ContextoCobanRef.Provider value={valor}>{children}</ContextoCobanRef.Provider>;
}

export function useCoban(): ContextoCoban {
  const ctx = useContext(ContextoCobanRef);
  if (!ctx) throw new Error('useCoban debe usarse dentro de <ProveedorCoban>.');
  return ctx;
}

// ================= Selectores derivados =================

export interface ResumenFinanciero {
  caja: number;
  deuda: number;
  cupoDisponible: number;
  totalAFavorTerceros: number;
  totalCxc: number;
}

export function useResumenFinanciero(): ResumenFinanciero {
  const { estado } = useCoban();
  return useMemo(() => {
    let totalAFavorTerceros = 0;
    let totalCxc = 0;
    for (const t of estado.terceros) {
      totalAFavorTerceros += t.saldoFavor;
      totalCxc += t.cxc;
    }
    return {
      caja: estado.caja,
      deuda: estado.deuda,
      cupoDisponible: cupoDisponibleCB(estado.deuda),
      totalAFavorTerceros,
      totalCxc,
    };
  }, [estado.caja, estado.deuda, estado.terceros]);
}

export function useTercerosConComision(): Tercero[] {
  const { estado } = useCoban();
  return useMemo(() => estado.terceros.filter((t) => t.comisionGenerada > 0), [estado.terceros]);
}

export function useMovimientosDe(terceroId: number): Movimiento[] {
  const { estado } = useCoban();
  return useMemo(
    () => estado.movimientos.filter((m) => m.terceroId === terceroId || m.receptorId === terceroId),
    [estado.movimientos, terceroId],
  );
}

/** Neto (saldoFavor - cxc) de un tercero por id; útil para reportes de otros puntos. */
export function useNetoTercero(terceroId: number): number {
  const { estado } = useCoban();
  return useMemo(() => {
    const t = estado.terceros.find((x) => x.id === terceroId);
    return t ? netoTercero(t) : 0;
  }, [estado.terceros, terceroId]);
}
