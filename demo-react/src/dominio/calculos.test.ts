import { describe, expect, it } from 'vitest';
import {
  aplicarNeto,
  calcularComision,
  calcularDispersion,
  comisionBancariaDe,
  cupoDisponibleCB,
  netoTercero,
  terceroElegible,
} from './calculos';
import { CUPO_ASIGNADO, DISPERSION_DEFAULT } from './constantes';
import type { Tercero } from './tipos';

function tercero(parcial: Partial<Tercero> = {}): Tercero {
  return {
    id: 1,
    nombre: 'Tercero de prueba',
    saldoFavor: 0,
    cxc: 0,
    cupo: 0,
    datafono: true,
    comisionGenerada: 0,
    comisionBancaria: 5_000,
    dispersion: { ...DISPERSION_DEFAULT },
    ...parcial,
  };
}

describe('netoTercero / aplicarNeto', () => {
  it('neto es saldoFavor - cxc', () => {
    expect(netoTercero(tercero({ saldoFavor: 3_000_000, cxc: 0 }))).toBe(3_000_000);
    expect(netoTercero(tercero({ saldoFavor: 0, cxc: 1_500_000 }))).toBe(-1_500_000);
  });

  it('aplicarNeto reparte todo a saldoFavor cuando el neto es >= 0', () => {
    const t = aplicarNeto(tercero({ saldoFavor: 1, cxc: 1 }), 3_495_000);
    expect(t.saldoFavor).toBe(3_495_000);
    expect(t.cxc).toBe(0);
  });

  it('aplicarNeto reparte todo a cxc cuando el neto es negativo', () => {
    const t = aplicarNeto(tercero({ saldoFavor: 1, cxc: 1 }), -1_500_000);
    expect(t.saldoFavor).toBe(0);
    expect(t.cxc).toBe(1_500_000);
  });

  it('nunca deja saldoFavor y cxc ambos distintos de cero, para cualquier neto', () => {
    for (const neto of [-5_000_000, -1, 0, 1, 2_500_000]) {
      const t = aplicarNeto(tercero(), neto);
      expect(t.saldoFavor === 0 || t.cxc === 0).toBe(true);
    }
  });
});

describe('cupoDisponibleCB', () => {
  it('es el cupo asignado menos la deuda actual', () => {
    expect(cupoDisponibleCB(2_000_000)).toBe(CUPO_ASIGNADO - 2_000_000);
    expect(cupoDisponibleCB(0)).toBe(CUPO_ASIGNADO);
  });
});

describe('calcularDispersion', () => {
  it('caso exacto: 5.000.000 con mult 1 → 5.000', () => {
    expect(calcularDispersion(5_000_000, 1)).toBe(5_000);
  });

  it('redondea al millar superior en un caso no exacto', () => {
    // 1.234.567 * 2 / 1000 / 1000 = 2.469134 → ceil → 3 → *1000 = 3000
    expect(calcularDispersion(1_234_567, 2)).toBe(3_000);
  });

  it('mult 0 no genera dispersión', () => {
    expect(calcularDispersion(1_000_000, 0)).toBe(0);
  });
});

describe('comisionBancariaDe / calcularComision', () => {
  it('solo cobra comisión bancaria si el método la aplica', () => {
    const t = tercero({ comisionBancaria: 5_000 });
    expect(comisionBancariaDe(t, 'transferencia')).toBe(0); // METODOS.transferencia.bancaria = false
    expect(comisionBancariaDe(t, 'entrega_efectivo')).toBe(5_000); // .bancaria = true
  });

  it('calcularComision suma bancaria + dispersión', () => {
    const t = tercero({ comisionBancaria: 5_000, dispersion: { ...DISPERSION_DEFAULT, transferencia: 1 } });
    const c = calcularComision(t, 'transferencia', 5_000_000);
    expect(c.bancaria).toBe(0);
    expect(c.dispersion).toBe(5_000);
    expect(c.total).toBe(5_000);
  });
});

describe('terceroElegible', () => {
  it('elegible si el neto a favor cubre el monto', () => {
    const t = tercero({ saldoFavor: 2_000_000, cxc: 0, cupo: 0 });
    expect(terceroElegible(t, 2_000_000)).toBe(true);
    expect(terceroElegible(t, 2_000_001)).toBe(false);
  });

  it('elegible si el cupo cubre el monto, aunque el neto sea 0 o negativo', () => {
    const t = tercero({ saldoFavor: 0, cxc: 1_000_000, cupo: 500_000 });
    expect(terceroElegible(t, 500_000)).toBe(true);
    expect(terceroElegible(t, 500_001)).toBe(false);
  });

  it('no elegible si ni el neto ni el cupo alcanzan', () => {
    const t = tercero({ saldoFavor: 0, cxc: 0, cupo: 0 });
    expect(terceroElegible(t, 1)).toBe(false);
  });

  it('sin datáfono nunca es elegible, aunque el saldo a favor sobre', () => {
    const sinDatafono = tercero({ datafono: false, saldoFavor: 2_000_000, cxc: 0, cupo: 0 });
    expect(terceroElegible(sinDatafono, 1_000_000)).toBe(false);

    const conDatafono = tercero({ ...sinDatafono, datafono: true });
    expect(terceroElegible(conDatafono, 1_000_000)).toBe(true);
  });
});
