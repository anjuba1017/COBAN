/**
 * Cálculos puros del dominio Coban365. Sin React, sin efectos secundarios.
 * Puerto de referencia/logica.js (funciones `cupoDe`, `elegible`, y el bloque
 * de comisión de `registrarTerceroModal`, líneas 946, 1476-1480, 2024-2031).
 */

import { CUPO_ASIGNADO, METODOS } from './constantes';
import type { MetodoEnvioId, Tercero } from './tipos';

/** Positivo: el CB le debe al tercero. Negativo: el tercero le debe al CB. */
export function netoTercero(t: Tercero): number {
  return t.saldoFavor - t.cxc;
}

/**
 * Reparte un neto en saldoFavor/cxc, nunca deja ambos ≠ 0 a la vez:
 * neto >= 0 → todo a saldoFavor; neto < 0 → todo a cxc.
 */
export function aplicarNeto(t: Tercero, neto: number): Tercero {
  if (neto >= 0) {
    return { ...t, saldoFavor: neto, cxc: 0 };
  }
  return { ...t, saldoFavor: 0, cxc: -neto };
}

/** Cupo que le queda al CB frente al banco, dada la deuda actual. */
export function cupoDisponibleCB(deuda: number): number {
  return CUPO_ASIGNADO - deuda;
}

/** Redondeo al millar superior, igual que logica.js:2029. */
export function calcularDispersion(monto: number, mult: number): number {
  return Math.ceil((monto * mult) / 1000 / 1000) * 1000;
}

// Nota: equivalente a Math.ceil((monto*mult/1000)/1000)*1000 (misma asociatividad
// aritmética; el orden de las divisiones no cambia el resultado para los valores
// enteros usados en el dominio).

/** Comisión bancaria fija del tercero, solo si el método la aplica; si no, 0. */
export function comisionBancariaDe(t: Tercero, metodo: MetodoEnvioId): number {
  return METODOS[metodo].bancaria ? t.comisionBancaria : 0;
}

export interface Comision {
  bancaria: number;
  dispersion: number;
  total: number;
}

export function calcularComision(t: Tercero, metodo: MetodoEnvioId, monto: number): Comision {
  const bancaria = comisionBancariaDe(t, metodo);
  const mult = t.dispersion[metodo] ?? 0;
  const dispersion = calcularDispersion(monto, mult);
  return { bancaria, dispersion, total: bancaria + dispersion };
}

/**
 * Un tercero es elegible como destino de un movimiento si puede cubrir el monto,
 * ya sea con lo que el CB le debe (neto a favor) o con su cupo autorizado, y
 * además está habilitado para datáfono: un tercero sin datáfono es una cuenta
 * de otro banco y nunca puede ser destino (logica.js:1476-1480).
 */
export function terceroElegible(t: Tercero, monto: number): boolean {
  if (!t.datafono) return false;
  const neto = netoTercero(t);
  return (neto > 0 && monto <= neto) || monto <= t.cupo;
}
