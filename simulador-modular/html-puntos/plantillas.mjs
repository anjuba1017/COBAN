/** Registry and shared helpers for the modular simulator. */
export const PUNTOS = [
  { archivo: 'punto-0.html', tab: 'tab13', n: '0', titulo: 'Checklist General', ordenDom: 0, predeterminado: true },
  { archivo: 'punto-1.html', tab: 'tab5', n: '1', titulo: 'Rol SuperAdmin', ordenDom: 5 },
  { archivo: 'punto-2.html', tab: 'tab1', n: '2', titulo: 'Rol Admin', ordenDom: 1 },
  { archivo: 'punto-3.html', tab: 'tab6', n: '3', titulo: 'Rol Cajero', ordenDom: 2 },
  { archivo: 'punto-4.html', tab: 'tab7', n: '4', titulo: 'Terceros (A)', ordenDom: 3 },
  { archivo: 'punto-5.html', tab: 'tab4', n: '5', titulo: 'Terceros (B)', ordenDom: 4 },
  { archivo: 'punto-6.html', tab: 'tab12', n: '6', titulo: 'Reportes SuperAdmin', ordenDom: 6 },
  { archivo: 'punto-7.html', tab: 'tab9', n: '7', titulo: 'Reportes Admin', ordenDom: 7 },
  { archivo: 'punto-8.html', tab: 'tab11', n: '8', titulo: 'Reportes Cajero', ordenDom: 8 },
];

function escaparHtml(texto) {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function botonPunto(punto, activo) {
  const clase = activo ? 'tab-btn active' : 'tab-btn';
  const tab = escaparHtml(punto.tab);
  return `<button class="${clase}" data-tab="${tab}" onclick="goTab('${tab}')"><span class="n">${escaparHtml(punto.n)}</span>${escaparHtml(punto.titulo)}</button>`;
}
