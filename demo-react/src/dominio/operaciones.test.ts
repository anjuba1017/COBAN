import { describe, expect, it } from 'vitest';
import { netoTercero } from './calculos';
import { COMISION_BANCARIA_DEFAULT, DISPERSION_DEFAULT } from './constantes';
import {
  registrarMovimientoCaja,
  registrarPrestamoTercero,
  retirarComision,
  type EstadoFinanciero,
} from './operaciones';
import type { Tercero } from './tipos';

function mauricio(parcial: Partial<Tercero> = {}): Tercero {
  return {
    id: 1,
    nombre: 'Mauricio Chará',
    saldoFavor: 3_000_000,
    cxc: 0,
    cupo: 0,
    datafono: true,
    comisionGenerada: 0,
    comisionBancaria: COMISION_BANCARIA_DEFAULT,
    dispersion: { ...DISPERSION_DEFAULT, transferencia: 1 },
    ...parcial,
  };
}

function receptor(parcial: Partial<Tercero> = {}): Tercero {
  return {
    id: 2,
    nombre: 'Lucía López',
    saldoFavor: 0,
    cxc: 0,
    cupo: 0,
    datafono: true,
    comisionGenerada: 0,
    comisionBancaria: COMISION_BANCARIA_DEFAULT,
    dispersion: { ...DISPERSION_DEFAULT },
    ...parcial,
  };
}

function estadoBase(terceros: Tercero[]): EstadoFinanciero {
  return { caja: 4_000_000, deuda: 2_000_000, terceros, movimientos: [], contador: 0 };
}

describe('escenario Mauricio Chará completo', () => {
  it('el préstamo salda primero el cxc pendiente y solo el remanente va a saldo a favor', () => {
    let estado = estadoBase([mauricio()]);

    // 1) Depósito con cargo a tercero de 1.000.000 → neto 2.000.000
    let r = registrarMovimientoCaja(estado, {
      categoria: 'Depósitos',
      tipo: 'Depósito',
      monto: 1_000_000,
      destino: 'tercero',
      terceroId: 1,
    });
    if ('error' in r) throw new Error(r.error);
    estado = r.estado;
    expect(netoTercero(estado.terceros[0])).toBe(2_000_000);

    // 2) Otra de 2.000.000 → neto 0
    r = registrarMovimientoCaja(estado, {
      categoria: 'Depósitos',
      tipo: 'Depósito',
      monto: 2_000_000,
      destino: 'tercero',
      terceroId: 1,
    });
    if ('error' in r) throw new Error(r.error);
    estado = r.estado;
    expect(netoTercero(estado.terceros[0])).toBe(0);

    // 3) Se le autoriza cupo 2.000.000 (fuera de las operaciones financieras: es
    // un cambio administrativo directo sobre el tercero, como haría 'actualizarTercero').
    estado = {
      ...estado,
      terceros: estado.terceros.map((t) => (t.id === 1 ? { ...t, cupo: 2_000_000 } : t)),
    };

    // 4) Pide otra de 1.500.000 → neto -1.500.000 (cxc 1.500.000), con cargo al cupo
    r = registrarMovimientoCaja(estado, {
      categoria: 'Depósitos',
      tipo: 'Depósito',
      monto: 1_500_000,
      destino: 'tercero',
      terceroId: 1,
    });
    if ('error' in r) throw new Error(r.error);
    estado = r.estado;
    expect(estado.terceros[0].cxc).toBe(1_500_000);
    expect(netoTercero(estado.terceros[0])).toBe(-1_500_000);

    // 5) Préstamo de Tercero de 5.000.000 por transferencia (dispersión 5.000 con mult 1)
    //    → comisión total 5.000, saldoNeto 4.995.000, neto final 3.495.000 (NO 4.995.000:
    //    ese sería el bug de ignorar el cxc previo de 1.500.000).
    const rp = registrarPrestamoTercero(estado, { terceroId: 1, metodo: 'transferencia', monto: 5_000_000 });
    if ('error' in rp) throw new Error(rp.error);
    estado = rp.estado;

    const t = estado.terceros[0];
    expect(netoTercero(t)).toBe(3_495_000);
    expect(netoTercero(t)).not.toBe(4_995_000);
    expect(t.saldoFavor).toBe(3_495_000);
    expect(t.cxc).toBe(0);
  });
});

describe('movimientos con cargo a tercero nunca generan comisión', () => {
  it('depósito con cargo a tercero: comisión total 0, comisionGenerada intacta', () => {
    const estado = estadoBase([mauricio({ comisionGenerada: 10_000 })]);
    const r = registrarMovimientoCaja(estado, {
      categoria: 'Depósitos',
      tipo: 'Depósito',
      monto: 500_000,
      destino: 'tercero',
      terceroId: 1,
    });
    if ('error' in r) throw new Error(r.error);
    const movimiento = r.estado.movimientos[0];
    expect(movimiento.comisionDelta).toBe(0);
    expect(movimiento.bancaria).toBe(0);
    expect(movimiento.dispersion).toBe(0);
    expect(r.estado.terceros[0].comisionGenerada).toBe(10_000);
  });

  it('retiro con cargo a tercero: comisión total 0, comisionGenerada intacta', () => {
    const estado = estadoBase([mauricio({ comisionGenerada: 10_000 })]);
    const r = registrarMovimientoCaja(estado, {
      categoria: 'Retiros',
      tipo: 'Retiro',
      monto: 500_000,
      destino: 'tercero',
      terceroId: 1,
    });
    if ('error' in r) throw new Error(r.error);
    const movimiento = r.estado.movimientos[0];
    expect(movimiento.comisionDelta).toBe(0);
    expect(r.estado.terceros[0].comisionGenerada).toBe(10_000);
  });
});

describe('préstamo de tercero con receptor', () => {
  it('genera comisión = bancaria + dispersión y el receptor queda con cxc += monto', () => {
    const estado = estadoBase([mauricio(), receptor()]);
    const r = registrarPrestamoTercero(estado, {
      terceroId: 1,
      metodo: 'transferencia',
      monto: 5_000_000,
      receptorId: 2,
    });
    if ('error' in r) throw new Error(r.error);

    const movimiento = r.estado.movimientos[0];
    // transferencia: bancaria=false → 0; dispersión con mult 1 sobre 5.000.000 → 5.000
    expect(movimiento.bancaria).toBe(0);
    expect(movimiento.dispersion).toBe(5_000);
    expect(movimiento.comisionDelta).toBe(5_000);

    const receptorDespues = r.estado.terceros.find((t) => t.id === 2)!;
    expect(receptorDespues.cxc).toBe(5_000_000);
    expect(movimiento.receptorId).toBe(2);
    expect(movimiento.receptorNetoDespues).toBe(-5_000_000);
  });

  it('con un método bancario suma la comisión bancaria fija del tercero', () => {
    const estado = estadoBase([mauricio({ comisionBancaria: 5_000, dispersion: { ...DISPERSION_DEFAULT, entrega_efectivo: 2 } })]);
    const r = registrarPrestamoTercero(estado, { terceroId: 1, metodo: 'entrega_efectivo', monto: 1_000_000 });
    if ('error' in r) throw new Error(r.error);
    const movimiento = r.estado.movimientos[0];
    expect(movimiento.bancaria).toBe(5_000);
    expect(movimiento.dispersion).toBe(2_000); // ceil(1_000_000*2/1000/1000)*1000
    expect(movimiento.comisionDelta).toBe(7_000);
  });
});

describe('validaciones de registrarMovimientoCaja', () => {
  it('depósito mayor a 3.000.000 devuelve error de monto máximo', () => {
    const estado = estadoBase([]);
    const r = registrarMovimientoCaja(estado, {
      categoria: 'Depósitos',
      tipo: 'Depósito',
      monto: 3_500_000,
      destino: 'caja',
    });
    expect('error' in r).toBe(true);
    if ('error' in r) expect(r.error).toMatch(/máximo \$3\.000\.000/);
  });

  it('retiro mayor que la caja disponible devuelve error de fondos', () => {
    const estado = estadoBase([]); // caja = 4.000.000
    const r = registrarMovimientoCaja(estado, {
      categoria: 'Retiros',
      tipo: 'Retiro',
      monto: 4_000_001,
      destino: 'caja',
    });
    expect('error' in r).toBe(true);
    if ('error' in r) expect(r.error).toMatch(/fondos suficientes/);
  });

  it('depósito mayor al cupo disponible del CB devuelve error de cupo', () => {
    const estado: EstadoFinanciero = { ...estadoBase([]), deuda: 24_500_000 }; // cupo disponible = 500.000
    const r = registrarMovimientoCaja(estado, {
      categoria: 'Depósitos',
      tipo: 'Depósito',
      monto: 600_000,
      destino: 'caja',
    });
    expect('error' in r).toBe(true);
    if ('error' in r) expect(r.error).toMatch(/cupo disponible/);
  });

  it('consulta de saldo (Otros/Saldo) no afecta caja ni deuda', () => {
    const estado = estadoBase([]);
    const r = registrarMovimientoCaja(estado, { categoria: 'Otros', tipo: 'Saldo', monto: 0, destino: 'caja' });
    if ('error' in r) throw new Error(r.error);
    expect(r.estado.caja).toBe(estado.caja);
    expect(r.estado.deuda).toBe(estado.deuda);
    expect(r.estado.movimientos[0].valor).toBe(0);
  });
});

describe('retirarComision', () => {
  it('pone comisionGenerada en 0 y registra un movimiento con comisionDelta negativo', () => {
    const estado = estadoBase([mauricio({ comisionGenerada: 12_000 })]);
    const r = retirarComision(estado, 1);
    if ('error' in r) throw new Error(r.error);
    expect(r.estado.terceros[0].comisionGenerada).toBe(0);
    expect(r.estado.movimientos[0].comisionDelta).toBe(-12_000);
  });

  it('da error si ya está en 0', () => {
    const estado = estadoBase([mauricio({ comisionGenerada: 0 })]);
    const r = retirarComision(estado, 1);
    expect('error' in r).toBe(true);
  });
});

describe('inmutabilidad', () => {
  it('registrarMovimientoCaja no muta el estado ni los terceros originales', () => {
    const original = estadoBase([mauricio()]);
    const snapshotTercero = { ...original.terceros[0] };
    registrarMovimientoCaja(original, {
      categoria: 'Depósitos',
      tipo: 'Depósito',
      monto: 500_000,
      destino: 'tercero',
      terceroId: 1,
    });
    expect(original.terceros[0]).toEqual(snapshotTercero);
    expect(original.movimientos).toEqual([]);
  });
});
