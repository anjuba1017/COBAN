/**
 * Tipos del dominio Coban365.
 *
 * Convención de signos para un tercero:
 *   saldoFavor > 0  → el CB le debe al tercero
 *   cxc > 0         → el tercero le debe al CB (usó su cupo)
 *   neto = saldoFavor - cxc  → positivo: el CB debe; negativo: el tercero debe
 *
 * Un tercero nunca tiene saldoFavor y cxc simultáneamente distintos de cero:
 * siempre se guardan neteados (ver `aplicarNeto` en calculos.ts).
 */

export type MetodoEnvioId =
  | 'transferencia'
  | 'compensacion'
  | 'compensacion_otro_cb'
  | 'consignacion_sucursal'
  | 'consignacion_cajero'
  | 'consignacion_cb'
  | 'entrega_efectivo';

export interface MetodoEnvio {
  label: string;
  /** Si true, aplica la comisión bancaria configurada para el tercero. */
  bancaria: boolean;
  /** Requiere elegir una cuenta destino (otro tercero con datáfono). */
  needsAccount: boolean;
  /** Requiere elegir un corresponsal externo destino. */
  needsCorresponsal: boolean;
  /** Compensa contra la deuda del CB con el banco. */
  compensaBanco: boolean;
  /** El dinero entra físicamente a la caja del cajero. */
  pasaCaja: boolean;
}

export interface Tercero {
  id: number;
  nombre: string;
  /** El CB le debe este valor al tercero. */
  saldoFavor: number;
  /** El tercero le debe este valor al CB. */
  cxc: number;
  /** Cupo disponible que el CB le autorizó. */
  cupo: number;
  /**
   * true = cuenta propia alcanzable por datáfono/transferencia; puede aparecer
   * como destino de un movimiento. false = cuenta de otro banco, nunca se lista.
   */
  datafono: boolean;
  /** Comisión acumulada que el CB ha ganado con este tercero. */
  comisionGenerada: number;
  ultimaComisionFecha?: string;
  /** Comisión bancaria fija parametrizada al crear el tercero. */
  comisionBancaria: number;
  /** Multiplicador de dispersión por método (valor × 1000). */
  dispersion: Record<MetodoEnvioId, number>;
}

export type CategoriaMovimiento =
  | 'Depósitos'
  | 'Retiros'
  | 'Compensación'
  | 'Transferencias'
  | 'Préstamo de Tercero'
  | 'Otros';

export type DestinoMovimiento = 'caja' | 'tercero';

export interface Movimiento {
  n: number;
  fecha: string;
  /** Etiqueta del tipo de transacción, p. ej. "Depósito" o "Préstamo de Tercero (Transferencia)". */
  tipo: string;
  categoria: CategoriaMovimiento;
  valor: number;
  destino: DestinoMovimiento | null;
  terceroId: number | null;
  terceroNombre: string | null;
  metodo: MetodoEnvioId | null;
  referencia: string;
  nota: string;

  /** Deltas contables — lo que este movimiento le hizo al estado. */
  cajaDelta: number;
  deudaDelta: number;
  /** Cambio en el neto del tercero originador (positivo = el CB le debe más). */
  netoDelta: number;
  comisionDelta: number;

  /** Comisión desglosada (solo Préstamo de Tercero la genera). */
  bancaria: number;
  dispersion: number;

  /** Snapshot antes/después, para el detalle del historial. */
  cajaAntes: number;
  cajaDespues: number;
  deudaAntes: number;
  deudaDespues: number;
  cupoAntes: number;
  cupoDespues: number;
  netoAntes: number;
  netoDespues: number;

  /** Tercero receptor cuando el método exige cuenta/corresponsal destino. */
  receptorId: number | null;
  receptorNombre: string | null;
  receptorNetoAntes: number | null;
  receptorNetoDespues: number | null;

  esPrestamo: boolean;
}

export type AmbitoCausa = 'efectivo' | 'banco';
export type DireccionCausa = 'sobrante' | 'faltante';

export interface Causa {
  id: string;
  texto: string;
  ambito: AmbitoCausa;
  direccion: DireccionCausa;
  /** true para la opción "Otra (especificar)", que abre un campo libre. */
  libre?: boolean;
}

export interface Cajero {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface CierreCaja {
  id: number;
  fecha: string;
  cajero: string;
  /** Neto que Coban365 calculó para el día. */
  netoCoban: number;
  /** Neto que el cajero digita leyendo el datáfono. */
  netoDatafono: number;
  /** Efectivo físico contado (arqueo). */
  efectivoContado: number;
  /** Efectivo que el sistema esperaba en caja. */
  efectivoEsperado: number;
  diferenciaBanco: number;
  diferenciaEfectivo: number;
  causasBanco: string[];
  causasEfectivo: string[];
  otraBanco: string;
  otraEfectivo: string;
}

export interface Corresponsal {
  id: number;
  codigo: string;
  nombre: string;
  /** Red del datáfono: define qué formato de reporte diario se usa. */
  red: 'REDEBAN' | 'WOMPI';
  plan: 'Freemium' | 'Premium';
  activo: boolean;
  ultimoMovimiento: string;
  vencePlan: string | null;
}
