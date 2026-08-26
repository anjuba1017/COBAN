/**
 * Utilidades de formato de dinero y fecha, es-CO.
 * Puerto directo de las funciones `pesos`, `signed` y `formatMoneyInput`
 * de referencia/logica.js (líneas 237-238 y 924-930).
 */

/** '$4.000.000' — redondeado, sin decimales, con signo negativo al frente si aplica. */
export function pesos(n: number): string {
  const redondeado = Math.round(n || 0);
  const signo = redondeado < 0 ? '-' : '';
  return signo + '$' + Math.abs(redondeado).toLocaleString('es-CO');
}

/** '+$45.000' / '-$60.000' / '$0' — útil para mostrar diferencias. */
export function pesosConSigno(n: number): string {
  const redondeado = Math.round(n || 0);
  if (redondeado === 0) return '$0';
  return (redondeado > 0 ? '+' : '-') + pesos(Math.abs(redondeado));
}

/** Quita todo lo que no sea dígito y parsea a entero (0 si queda vacío). */
export function parsearPesos(texto: string): number {
  const raw = texto.replace(/[^0-9]/g, '');
  return raw ? parseInt(raw, 10) : 0;
}

/**
 * Formatea el valor de un input de dinero mientras el usuario escribe:
 * quita ceros a la izquierda y antepone '$ '. String vacío se mantiene vacío
 * (para no forzar '$ 0' apenas el usuario borra el campo).
 */
export function formatearInputPesos(texto: string): string {
  let raw = texto.replace(/[^0-9]/g, '');
  if (raw === '') return '';
  raw = raw.replace(/^0+(?=\d)/, '');
  const n = parseInt(raw, 10) || 0;
  return '$ ' + n.toLocaleString('es-CO');
}

/** '26/08/2026 18:45' — es-CO, 24 horas. */
export function fechaHoraCorta(d: Date = new Date()): string {
  // toLocaleDateString('es-CO') sin opciones no rellena el mes/día con cero
  // (da '26/8/2026'); se fuerza 2 dígitos explícitamente.
  const fecha = d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora = d.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${fecha} ${hora}`;
}
