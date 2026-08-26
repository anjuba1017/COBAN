/**
 * Constantes del dominio Coban365.
 * Puerto de referencia/logica.js (líneas 155-181, 896-921, 978-981).
 */

import type {
  AmbitoCausa,
  Causa,
  DireccionCausa,
  MetodoEnvio,
  MetodoEnvioId,
} from './tipos';

/** Cupo total que el banco le asigna al corresponsal. */
export const CUPO_ASIGNADO = 25_000_000;

/** Comisión bancaria fija por defecto al crear un tercero (logica.js:2027 usa cfg.bancaria). */
export const COMISION_BANCARIA_DEFAULT = 5_000;

export const DENOMINACIONES_BILLETES = [100_000, 50_000, 20_000, 10_000, 5_000, 2_000, 1_000] as const;
export const DENOMINACIONES_MONEDAS = [1_000, 500, 200, 100, 50] as const;

/** Los 7 métodos de envío de dinero a un tercero — logica.js:913-921. */
export const METODOS: Record<MetodoEnvioId, MetodoEnvio> = {
  transferencia: {
    label: 'Transferencia',
    bancaria: false,
    needsAccount: true,
    needsCorresponsal: false,
    compensaBanco: false,
    pasaCaja: false,
  },
  compensacion: {
    label: 'Compensación',
    bancaria: false,
    needsAccount: false,
    needsCorresponsal: false,
    compensaBanco: true,
    pasaCaja: false,
  },
  compensacion_otro_cb: {
    label: 'Compensación a otro CB',
    bancaria: false,
    needsAccount: false,
    needsCorresponsal: true,
    compensaBanco: false,
    pasaCaja: false,
  },
  consignacion_sucursal: {
    label: 'Consignación en sucursal',
    bancaria: true,
    needsAccount: true,
    needsCorresponsal: false,
    compensaBanco: false,
    pasaCaja: false,
  },
  consignacion_cajero: {
    label: 'Consignación Cajero',
    bancaria: true,
    needsAccount: true,
    needsCorresponsal: false,
    compensaBanco: false,
    pasaCaja: false,
  },
  consignacion_cb: {
    label: 'Consignación CB',
    bancaria: true,
    needsAccount: true,
    needsCorresponsal: false,
    compensaBanco: false,
    pasaCaja: false,
  },
  entrega_efectivo: {
    label: 'Entrega en efectivo',
    bancaria: true,
    needsAccount: false,
    needsCorresponsal: false,
    compensaBanco: false,
    pasaCaja: true,
  },
};

/** Multiplicador de dispersión por defecto (× 1000) — logica.js:978-981. */
export const DISPERSION_DEFAULT: Record<MetodoEnvioId, number> = {
  transferencia: 1,
  compensacion: 1,
  compensacion_otro_cb: 1,
  consignacion_sucursal: 2,
  consignacion_cajero: 2,
  consignacion_cb: 2,
  entrega_efectivo: 2,
};

/**
 * Catálogo de causas de sobrante/faltante — logica.js:159-173, CON DOS CORRECCIONES
 * validadas explícitamente por el usuario (el HTML maestro está desactualizado):
 *
 * - c11: la dirección correcta es 'sobrante', no 'faltante'. Si el datáfono no procesó
 *   el retiro no hubo entrega de dinero; si el banco sí lo aprobó, se le debe menos al
 *   banco y sobra efectivo en caja.
 * - c12: el texto original ("revertida... dinero retenido en sucursal") no correspondía
 *   al caso real de compensación no registrada; se reemplaza. La dirección sigue 'faltante'.
 */
export const CATALOGO_CAUSAS: Causa[] = [
  { id: 'c01', texto: 'Depósito, recaudo o recarga registrada por valor diferente', ambito: 'efectivo', direccion: 'sobrante' },
  { id: 'c02', texto: 'El cliente dejó más efectivo del real', ambito: 'efectivo', direccion: 'sobrante' },
  { id: 'c03', texto: 'Se recibieron propinas', ambito: 'efectivo', direccion: 'sobrante' },
  { id: 'c04', texto: 'Se entregó menos dinero al cliente en un retiro', ambito: 'efectivo', direccion: 'sobrante' },
  { id: 'c05', texto: 'Transacción de depósito sin recibir dinero del cliente', ambito: 'efectivo', direccion: 'faltante' },
  { id: 'c06', texto: 'Retiro con entrega de más efectivo del solicitado', ambito: 'efectivo', direccion: 'faltante' },
  { id: 'c07', texto: 'Transacción solicitada por WhatsApp o teléfono sin registrar', ambito: 'efectivo', direccion: 'faltante' },
  { id: 'c08', texto: 'Transacción de depósito recibiendo menos dinero del acordado', ambito: 'efectivo', direccion: 'faltante' },
  { id: 'c09', texto: 'Transacción tipo Transferencia pero se entrega efectivo al cliente', ambito: 'efectivo', direccion: 'faltante' },
  { id: 'c10', texto: 'Depósito con voucher que el banco no registró', ambito: 'banco', direccion: 'sobrante' },
  { id: 'c11', texto: 'Retiro no procesado por datáfono pero sí por el banco', ambito: 'banco', direccion: 'sobrante' },
  { id: 'c12', texto: 'Compensación no registrada en el banco (revisar soportes)', ambito: 'banco', direccion: 'faltante' },
  { id: 'c13', texto: 'Depósito rechazado en datáfono pero aprobado por el banco', ambito: 'banco', direccion: 'faltante' },
  { id: 'otra_efectivo', texto: 'Otra (especificar)', ambito: 'efectivo', direccion: 'sobrante', libre: true },
  { id: 'otra_banco', texto: 'Otra (especificar)', ambito: 'banco', direccion: 'sobrante', libre: true },
];

/**
 * Causas aplicables a un ámbito/dirección. Siempre incluye la causa libre ("Otra")
 * de ese ámbito, sin importar la dirección: la opción de especificar debe estar
 * disponible tanto para sobrante como para faltante.
 */
export function causasPara(ambito: AmbitoCausa, direccion: DireccionCausa): Causa[] {
  return CATALOGO_CAUSAS.filter(
    (c) => c.ambito === ambito && (c.libre === true || c.direccion === direccion),
  );
}

/** Preguntas de confirmación antes de aceptar una causa libre — logica.js:230-234. */
export const PREGUNTAS_CHECKLIST: string[] = [
  '¿Revisaste si el datáfono mostró rechazo en alguna transacción que el banco ya tenía como aprobada (o al revés)?',
  '¿Comparaste el valor exacto contra el listado de movimientos del banco en línea (no solo el saldo total)?',
  '¿Descartaste que sea un movimiento de un tercero o una compensación que se te haya pasado por alto?',
];

export interface CasoCierre {
  name: string;
  note: string;
  app: number;
  bank: number;
  terceros: number;
  compensaciones: number;
  billQty: number[];
  bundleQty: number[];
  coinQty: number[];
  fecha: string;
  hour: string;
  cashier: string;
}

/** Los 5 casos demo de cierre de caja — logica.js:175-181. */
export const CASOS_CIERRE: CasoCierre[] = [
  {
    name: 'Caso 0 · Todo cuadra',
    note: 'Datafono = Neto Datáfono · efectivo = Caja actual',
    app: 2_450_000,
    bank: 2_250_000,
    terceros: 120_000,
    compensaciones: 80_000,
    billQty: [24, 1, 0, 0, 0, 0, 0],
    bundleQty: [0, 0, 0, 0, 0, 0, 0],
    coinQty: [0, 0, 0, 0, 0],
    fecha: '14 ago',
    hour: '6:00 p. m.',
    cashier: 'Soraya Monterrosa',
  },
  {
    name: 'Caso 1 · Sobrante',
    note: 'Datafono = Neto Datáfono · efectivo mayor que Caja actual (+$45.000)',
    app: 2_450_000,
    bank: 2_250_000,
    terceros: 120_000,
    compensaciones: 80_000,
    billQty: [24, 1, 0, 4, 1, 0, 0],
    bundleQty: [0, 0, 0, 0, 0, 0, 0],
    coinQty: [0, 0, 0, 0, 0],
    fecha: '13 ago',
    hour: '6:00 p. m.',
    cashier: 'Soraya Monterrosa',
  },
  {
    name: 'Caso 2 · Faltante',
    note: 'Datafono = Neto Datáfono · efectivo menor que Caja actual (-$60.000)',
    app: 3_180_000,
    bank: 3_030_000,
    terceros: 100_000,
    compensaciones: 50_000,
    billQty: [31, 0, 1, 0, 0, 0, 0],
    bundleQty: [0, 0, 0, 0, 0, 0, 0],
    coinQty: [0, 0, 0, 0, 0],
    fecha: '12 ago',
    hour: '5:45 p. m.',
    cashier: 'Soraya Monterrosa',
  },
  {
    name: 'Caso 3 · Dos diferencias (Coban365 registra de más, sobra)',
    note: 'Neto Datáfono > Datafono impreso (+$70.000) · efectivo mayor que Caja actual (+$45.000)',
    app: 4_860_000,
    bank: 4_490_000,
    terceros: 180_000,
    compensaciones: 120_000,
    billQty: [49, 0, 0, 0, 1, 0, 0],
    bundleQty: [0, 0, 0, 0, 0, 0, 0],
    coinQty: [0, 0, 0, 0, 0],
    fecha: '11 ago',
    hour: '5:30 p. m.',
    cashier: 'Soraya Monterrosa',
  },
  {
    name: 'Caso 4 · Dos diferencias (Datafono reporta de más, falta)',
    note: 'Neto Datáfono < Datafono impreso (-$75.000) · efectivo menor que Caja actual (-$40.000)',
    app: 5_240_000,
    bank: 5_065_000,
    terceros: 150_000,
    compensaciones: 100_000,
    billQty: [52, 0, 0, 0, 0, 0, 0],
    bundleQty: [0, 0, 0, 0, 0, 0, 0],
    coinQty: [0, 0, 0, 0, 0],
    fecha: '10 ago',
    hour: '5:15 p. m.',
    cashier: 'Soraya Monterrosa',
  },
];
