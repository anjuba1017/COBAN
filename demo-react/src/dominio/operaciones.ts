/**
 * Transiciones de estado puras del dominio Coban365. Ninguna función muta sus
 * argumentos: todas devuelven un `EstadoFinanciero` nuevo.
 *
 * Puerto de referencia/logica.js: `registrarDeposito` (1593-1694) y
 * `registrarTerceroModal` (2008-2101). `retirarComision` es una versión
 * ampliada de `retirarComisionMauricioDash` (1977-1981): el original solo
 * ponía `comisionGenerada` en 0 sin dejar rastro; aquí además se registra un
 * movimiento con `comisionDelta` negativo, tal como pide el brief.
 */

import { METODOS } from './constantes';
import { calcularComision, cupoDisponibleCB, netoTercero, terceroElegible, aplicarNeto } from './calculos';
import { fechaHoraCorta, pesos } from './formato';
import type { CategoriaMovimiento, DestinoMovimiento, MetodoEnvioId, Movimiento, Tercero } from './tipos';

export interface EstadoFinanciero {
  caja: number;
  deuda: number;
  terceros: Tercero[];
  movimientos: Movimiento[];
  contador: number;
}

export interface ResultadoOk {
  estado: EstadoFinanciero;
  mensaje: string;
}

export interface ResultadoError {
  error: string;
}

export type ResultadoOperacion = ResultadoOk | ResultadoError;

function reemplazarTercero(terceros: Tercero[], actualizado: Tercero): Tercero[] {
  return terceros.map((t) => (t.id === actualizado.id ? actualizado : t));
}

/** Construye el Movimiento con todos los campos requeridos; los omitidos se completan por el caller. */
function baseMovimiento(estado: EstadoFinanciero, campos: Partial<Movimiento> & Pick<Movimiento, 'tipo' | 'categoria' | 'valor'>): Movimiento {
  return {
    n: estado.contador + 1,
    fecha: fechaHoraCorta(),
    destino: null,
    terceroId: null,
    terceroNombre: null,
    metodo: null,
    referencia: '—',
    nota: '',
    cajaDelta: 0,
    deudaDelta: 0,
    netoDelta: 0,
    comisionDelta: 0,
    bancaria: 0,
    dispersion: 0,
    cajaAntes: estado.caja,
    cajaDespues: estado.caja,
    deudaAntes: estado.deuda,
    deudaDespues: estado.deuda,
    cupoAntes: cupoDisponibleCB(estado.deuda),
    cupoDespues: cupoDisponibleCB(estado.deuda),
    netoAntes: 0,
    netoDespues: 0,
    receptorId: null,
    receptorNombre: null,
    receptorNetoAntes: null,
    receptorNetoDespues: null,
    esPrestamo: false,
    ...campos,
  };
}

export interface ArgsMovimientoCaja {
  categoria: CategoriaMovimiento;
  tipo: string;
  monto: number;
  destino: DestinoMovimiento;
  terceroId?: number | null;
  referencia?: string;
}

/**
 * Depósito / Retiro / Compensación / consulta de Saldo. Port de `registrarDeposito`.
 */
export function registrarMovimientoCaja(estado: EstadoFinanciero, args: ArgsMovimientoCaja): ResultadoOperacion {
  const { categoria, tipo, monto, destino, terceroId = null, referencia = '—' } = args;

  // Consulta de saldo: no afecta nada, se registra en el historial con valor 0.
  const esConsultaSaldo = categoria === 'Otros' && tipo === 'Saldo';
  if (esConsultaSaldo) {
    const movimiento = baseMovimiento(estado, {
      tipo,
      categoria,
      valor: 0,
      nota: 'Consulta',
      cajaAntes: estado.caja,
      cajaDespues: estado.caja,
      deudaAntes: estado.deuda,
      deudaDespues: estado.deuda,
    });
    return {
      estado: {
        ...estado,
        movimientos: [movimiento, ...estado.movimientos],
        contador: estado.contador + 1,
      },
      mensaje: '[Saldo] Consulta realizada. No afecta caja, banco ni cupo.',
    };
  }

  if (monto <= 0) return { error: 'Ingresa una cantidad mayor a 0.' };

  // logica.js:1614 — este simulador no valida transferencias por esta vía.
  if (categoria === 'Transferencias') {
    return { error: 'Transferencias aún no se valida en este ejercicio.' };
  }

  // 'Préstamo de Tercero' no es una operación de caja: solo se registra a
  // través de registrarPrestamoTercero, que aplica la comisión y el neteo.
  if (categoria === 'Préstamo de Tercero') {
    return { error: 'Préstamo de Tercero no es una operación de caja: usa registrarPrestamoTercero.' };
  }

  const esDeposito = categoria === 'Depósitos';
  const esRetiro = categoria === 'Retiros';
  const esCompensacion = categoria === 'Compensación';

  if (!esDeposito && !esRetiro && !esCompensacion) {
    return { error: 'Combinación de categoría y tipo no soportada en este simulador.' };
  }

  const t = terceroId != null ? estado.terceros.find((x) => x.id === terceroId) ?? null : null;

  if (esDeposito && monto > 3_000_000) {
    return { error: 'Esta transacción no existe, verifique el monto (máximo $3.000.000 por el datáfono).' };
  }
  if ((esRetiro || esCompensacion) && monto > estado.caja) {
    return { error: 'No hay fondos suficientes en caja para este movimiento.' };
  }
  if (esDeposito && monto > cupoDisponibleCB(estado.deuda)) {
    return { error: 'No hay cupo disponible en este momento, intente más tarde.' };
  }
  if (destino === 'tercero') {
    if (!t) return { error: 'Selecciona un tercero destino.' };
    if (esCompensacion) return { error: 'La compensación no admite destino tercero.' };
    if (!terceroElegible(t, monto)) {
      return { error: `${t.nombre} no tiene cupo suficiente ni saldo a favor: esta operación NO SE PUEDE REALIZAR.` };
    }
  }

  const cajaAntes = estado.caja;
  const deudaAntes = estado.deuda;
  const cupoAntes = cupoDisponibleCB(deudaAntes);

  let cajaDelta = 0;
  let deudaDelta = 0;
  let mensaje: string;
  let terceroActualizado: Tercero | null = null;
  let netoAntes = 0;
  let netoDespues = 0;

  if (destino === 'caja' || !t) {
    if (esDeposito) {
      cajaDelta = monto;
      deudaDelta = monto;
    } else {
      // Retiro y Compensación descuentan caja y deuda por igual.
      cajaDelta = -monto;
      deudaDelta = -monto;
    }
    mensaje = esCompensacion
      ? `[${tipo}] por ${pesos(monto)} compensado correctamente contra la deuda del CB con el banco.`
      : `[${tipo}] por ${pesos(monto)} registrado correctamente en caja.`;
  } else {
    // Con cargo a un tercero: la caja solo se mueve en Retiros; en Depósitos el
    // dinero se descuenta del saldo del tercero, no de la caja física. La deuda
    // con el banco sigue el mismo signo que la categoría en ambos casos.
    // Regla explícita del negocio: estos movimientos NUNCA generan comisión.
    if (esDeposito) {
      deudaDelta = monto;
    } else {
      cajaDelta = -monto;
      deudaDelta = -monto;
    }

    netoAntes = netoTercero(t);
    if (t.saldoFavor > 0 && monto <= t.saldoFavor) {
      const nuevoSaldoFavor = Math.max(0, t.saldoFavor - monto);
      terceroActualizado = { ...t, saldoFavor: nuevoSaldoFavor };
      mensaje = esRetiro
        ? `[${tipo}] por ${pesos(monto)} entregado en efectivo y descontado correctamente del saldo a favor de ${t.nombre}, quedando el CB debiéndole ${pesos(nuevoSaldoFavor)}.`
        : `[${tipo}] por ${pesos(monto)} descontado correctamente del saldo a favor de ${t.nombre}, quedando el CB debiéndole ${pesos(nuevoSaldoFavor)}.`;
    } else {
      const nuevoCxc = t.cxc + monto;
      const nuevoCupo = Math.max(0, t.cupo - monto);
      terceroActualizado = { ...t, cxc: nuevoCxc, cupo: nuevoCupo };
      mensaje = esRetiro
        ? `[${tipo}] por ${pesos(monto)} entregado en efectivo con cargo al cupo de ${t.nombre}, que ahora le debe al CB ${pesos(nuevoCxc)}.`
        : `[${tipo}] por ${pesos(monto)} aplicado correctamente contra el cupo de ${t.nombre}, que ahora le debe al CB ${pesos(nuevoCxc)}.`;
    }
    netoDespues = netoTercero(terceroActualizado);
  }

  const cajaDespues = cajaAntes + cajaDelta;
  const deudaDespues = deudaAntes + deudaDelta;

  const movimiento = baseMovimiento(estado, {
    tipo,
    categoria,
    valor: monto,
    destino,
    terceroId: t ? t.id : null,
    terceroNombre: t ? t.nombre : null,
    referencia,
    nota: t ? t.nombre : '-',
    cajaDelta,
    deudaDelta,
    netoDelta: netoDespues - netoAntes,
    comisionDelta: 0,
    cajaAntes,
    cajaDespues,
    deudaAntes,
    deudaDespues,
    cupoAntes,
    cupoDespues: cupoDisponibleCB(deudaDespues),
    netoAntes,
    netoDespues,
  });

  return {
    estado: {
      ...estado,
      caja: cajaDespues,
      deuda: deudaDespues,
      terceros: terceroActualizado ? reemplazarTercero(estado.terceros, terceroActualizado) : estado.terceros,
      movimientos: [movimiento, ...estado.movimientos],
      contador: estado.contador + 1,
    },
    mensaje,
  };
}

export interface ArgsPrestamoTercero {
  terceroId: number;
  metodo: MetodoEnvioId;
  monto: number;
  referencia?: string;
  /**
   * Tercero receptor cuando el método exige cuenta/corresponsal destino
   * (needsAccount / needsCorresponsal). El brief no especifica cómo se
   * identifica el receptor en la firma de la función; se agrega este campo
   * opcional como la forma más conservadora de resolverlo — ver informe final.
   */
  receptorId?: number | null;
}

/** Préstamo de Tercero. Port de `registrarTerceroModal`. */
export function registrarPrestamoTercero(estado: EstadoFinanciero, args: ArgsPrestamoTercero): ResultadoOperacion {
  const { terceroId, metodo, monto, referencia = '—', receptorId = null } = args;

  const t = estado.terceros.find((x) => x.id === terceroId);
  if (!t) return { error: 'Selecciona un tercero.' };

  const m = METODOS[metodo];
  if (!m) return { error: 'Selecciona un método de envío para registrar.' };
  if (monto <= 0) return { error: 'Ingresa una cantidad mayor a 0.' };

  const comision = calcularComision(t, metodo, monto);
  const saldoNeto = monto - comision.total;

  const cajaAntes = estado.caja;
  const deudaAntes = estado.deuda;
  const cupoAntes = cupoDisponibleCB(deudaAntes);

  let cajaDelta = 0;
  let deudaDelta = 0;
  if (m.pasaCaja) {
    cajaDelta = monto;
    deudaDelta = monto;
  }
  if (m.compensaBanco) {
    deudaDelta = -monto;
  }
  const cajaDespues = cajaAntes + cajaDelta;
  const deudaDespues = deudaAntes + deudaDelta;

  // El préstamo primero salda la deuda previa del tercero (cxc) y solo el
  // remanente se suma como saldo a favor — es el neteo que evita duplicar
  // lo que el tercero ya debía.
  const netoAntes = netoTercero(t);
  const netoDespues = netoAntes + saldoNeto;
  const terceroPrestado = aplicarNeto(t, netoDespues);
  const comisionGenerada = t.comisionGenerada + comision.total;
  const terceroActualizado: Tercero = {
    ...terceroPrestado,
    comisionGenerada,
    ultimaComisionFecha: comision.total > 0 ? fechaHoraCorta() : t.ultimaComisionFecha,
  };

  let terceros = reemplazarTercero(estado.terceros, terceroActualizado);
  let receptorNombre: string | null = null;
  let receptorNetoAntes: number | null = null;
  let receptorNetoDespues: number | null = null;
  let receptorIdFinal: number | null = null;

  if ((m.needsAccount || m.needsCorresponsal) && receptorId != null) {
    const receptor = terceros.find((x) => x.id === receptorId) ?? null;
    if (receptor) {
      receptorNetoAntes = netoTercero(receptor);
      const receptorActualizado: Tercero = { ...receptor, cxc: receptor.cxc + monto };
      receptorNetoDespues = netoTercero(receptorActualizado);
      terceros = reemplazarTercero(terceros, receptorActualizado);
      receptorNombre = receptorActualizado.nombre;
      receptorIdFinal = receptorActualizado.id;
    }
  }

  const movimiento = baseMovimiento(estado, {
    tipo: `Préstamo de Tercero (${m.label})`,
    // El Préstamo de Tercero es la única operación del dominio que genera
    // comisión: tiene su propia categoría, independiente del método usado,
    // para que los reportes puedan filtrarla como tal.
    categoria: 'Préstamo de Tercero',
    valor: monto,
    destino: 'tercero',
    terceroId: t.id,
    terceroNombre: t.nombre,
    metodo,
    referencia,
    nota: t.nombre,
    cajaDelta,
    deudaDelta,
    netoDelta: saldoNeto,
    comisionDelta: comision.total,
    bancaria: comision.bancaria,
    dispersion: comision.dispersion,
    cajaAntes,
    cajaDespues,
    deudaAntes,
    deudaDespues,
    cupoAntes,
    cupoDespues: cupoDisponibleCB(deudaDespues),
    netoAntes,
    netoDespues,
    receptorId: receptorIdFinal,
    receptorNombre,
    receptorNetoAntes,
    receptorNetoDespues,
    esPrestamo: true,
  });

  const mensaje = `[Préstamo de Tercero — ${m.label}] por ${pesos(monto)} de ${t.nombre}, sumado a su estado de cuenta. Comisión generada: ${pesos(comision.total)} (bancaria ${pesos(comision.bancaria)} + dispersión ${pesos(comision.dispersion)}).`;

  return {
    estado: {
      ...estado,
      caja: cajaDespues,
      deuda: deudaDespues,
      terceros,
      movimientos: [movimiento, ...estado.movimientos],
      contador: estado.contador + 1,
    },
    mensaje,
  };
}

/** Retira (pone en 0) la comisión acumulada de un tercero. */
export function retirarComision(estado: EstadoFinanciero, terceroId: number): ResultadoOperacion {
  const t = estado.terceros.find((x) => x.id === terceroId);
  if (!t) return { error: 'Tercero no encontrado.' };
  if (t.comisionGenerada === 0) return { error: 'No hay comisión pendiente para retirar.' };

  const valorRetirado = t.comisionGenerada;
  const terceroActualizado: Tercero = { ...t, comisionGenerada: 0 };

  const movimiento = baseMovimiento(estado, {
    tipo: 'Retiro de comisión',
    categoria: 'Otros',
    valor: valorRetirado,
    terceroId: t.id,
    terceroNombre: t.nombre,
    nota: t.nombre,
    comisionDelta: -valorRetirado,
  });

  return {
    estado: {
      ...estado,
      terceros: reemplazarTercero(estado.terceros, terceroActualizado),
      movimientos: [movimiento, ...estado.movimientos],
      contador: estado.contador + 1,
    },
    mensaje: `Comisión de ${pesos(valorRetirado)} retirada correctamente para ${t.nombre}.`,
  };
}
