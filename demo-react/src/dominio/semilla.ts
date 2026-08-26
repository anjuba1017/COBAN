/**
 * Datos semilla compartidos por toda la app. Un único punto de verdad: ningún
 * punto/pantalla debe duplicar estos arreglos.
 * Puerto de referencia/logica.js (líneas 900-911, 943-944, 191).
 */

import { COMISION_BANCARIA_DEFAULT, DISPERSION_DEFAULT } from './constantes';
import type { Cajero, Corresponsal, Tercero } from './tipos';

const TERCEROS_BASE: ReadonlyArray<Omit<Tercero, 'comisionBancaria' | 'dispersion'>> = [
  { id: 1, nombre: 'Mauricio Chará', saldoFavor: 3_000_000, cxc: 0, cupo: 0, datafono: true, comisionGenerada: 0 },
  { id: 2, nombre: 'Lucía López', saldoFavor: 1_000_000, cxc: 0, cupo: 0, datafono: true, comisionGenerada: 0 },
  { id: 3, nombre: 'Luz Dary Gómez', saldoFavor: 0, cxc: 0, cupo: 2_000_000, datafono: true, comisionGenerada: 0 },
  { id: 4, nombre: 'Jose Ramirez', saldoFavor: 0, cxc: 0, cupo: 1_000_000, datafono: true, comisionGenerada: 0 },
  { id: 5, nombre: 'Nequi *4567', saldoFavor: 0, cxc: 2_000_000, cupo: 0, datafono: true, comisionGenerada: 0 },
  { id: 6, nombre: 'Bancolombia *9005', saldoFavor: 0, cxc: 0, cupo: 500_000, datafono: false, comisionGenerada: 0 },
  { id: 7, nombre: '66174- Barrio Pajonal', saldoFavor: 0, cxc: 0, cupo: 0, datafono: false, comisionGenerada: 0 },
  { id: 8, nombre: 'Daviplata *5678', saldoFavor: 0, cxc: 0, cupo: 0, datafono: false, comisionGenerada: 0 },
  { id: 9, nombre: '65398-Barrio Caracoli', saldoFavor: 0, cxc: 0, cupo: 0, datafono: false, comisionGenerada: 0 },
  { id: 10, nombre: '25426-Districol', saldoFavor: 0, cxc: 0, cupo: 0, datafono: false, comisionGenerada: 0 },
];

export const TERCEROS_SEMILLA: Tercero[] = TERCEROS_BASE.map((t) => ({
  ...t,
  comisionBancaria: COMISION_BANCARIA_DEFAULT,
  dispersion: { ...DISPERSION_DEFAULT },
}));

export const CAJA_INICIAL = 4_000_000;
export const DEUDA_INICIAL = 2_000_000;

export const CAJEROS_SEMILLA: Cajero[] = [
  { id: 1, nombre: 'Soraya Monterrosa', activo: true },
  { id: 2, nombre: 'Yohana Monterrosa', activo: true },
  { id: 3, nombre: 'Anyela Urrutia', activo: true },
];

/**
 * 6 corresponsales inventados (no vienen de logica.js) para alimentar el
 * "Resumen de Adopción" del Punto 6: mezcla de red y plan, con actividad y
 * vencimiento de plan variados a propósito (uno vencido, uno por vencer,
 * uno inactivo hace tiempo).
 */
export const CORRESPONSALES_SEMILLA: Corresponsal[] = [
  {
    id: 1,
    codigo: 'CB[12029]',
    nombre: 'Barrio Centenario',
    red: 'REDEBAN',
    plan: 'Premium',
    activo: true,
    ultimoMovimiento: '26/08/2026 08:10',
    vencePlan: '30/09/2026',
  },
  {
    id: 2,
    codigo: 'CB[10884]',
    nombre: 'Plaza de Mercado Norte',
    red: 'WOMPI',
    plan: 'Freemium',
    activo: true,
    ultimoMovimiento: '25/08/2026 17:42',
    vencePlan: null,
  },
  {
    id: 3,
    codigo: 'CB[13207]',
    nombre: 'Terminal de Transportes',
    red: 'REDEBAN',
    plan: 'Freemium',
    activo: true,
    ultimoMovimiento: '20/08/2026 12:05',
    vencePlan: null,
  },
  {
    id: 4,
    codigo: 'CB[11456]',
    nombre: 'Barrio El Prado',
    red: 'WOMPI',
    plan: 'Premium',
    activo: true,
    ultimoMovimiento: '26/08/2026 07:55',
    vencePlan: '01/09/2026',
  },
  {
    id: 5,
    codigo: 'CB[14732]',
    nombre: 'Villa del Río',
    red: 'REDEBAN',
    plan: 'Freemium',
    activo: false,
    ultimoMovimiento: '03/07/2026 15:20',
    vencePlan: null,
  },
  {
    id: 6,
    codigo: 'CB[15901]',
    nombre: 'San Fernando',
    red: 'WOMPI',
    plan: 'Premium',
    activo: true,
    ultimoMovimiento: '24/08/2026 19:33',
    vencePlan: '15/12/2026',
  },
];
