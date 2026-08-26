#!/usr/bin/env node
/**
 * Builds the central simulator from the canonical punto-N.html fragments.
 *
 *   node armar.mjs
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { botonPunto, PUNTOS } from './plantillas.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const INICIO = join(DIR, 'base-inicio.html');
const FIN = join(DIR, 'base-fin.html');
const DESTINO = join(DIR, 'index.html');
const MANIFIESTO = join(DIR, 'manifiesto.json');

function escaparRegex(valor) {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sha256(contenido) {
  return createHash('sha256').update(contenido).digest('hex');
}

function validarRegistro() {
  if (PUNTOS.length === 0) throw new Error('PUNTOS no puede estar vacío');
  const camposUnicos = ['archivo', 'tab', 'n', 'ordenDom'];
  for (const campo of camposUnicos) {
    const valores = PUNTOS.map((punto) => punto[campo]);
    if (new Set(valores).size !== valores.length) {
      throw new Error(`Hay valores duplicados en PUNTOS.${campo}`);
    }
  }
  if (PUNTOS.filter((punto) => punto.predeterminado).length !== 1) {
    throw new Error('Debe existir exactamente un punto predeterminado');
  }
}

function leerPunto(punto) {
  const ruta = join(DIR, punto.archivo);
  const fragmento = readFileSync(ruta, 'utf8').trimEnd();
  const tab = escaparRegex(punto.tab);
  const raiz = new RegExp(
    `<div\\s+id="${tab}"\\s+class="tab-content(?:\\s+active)?"(?=\\s|>)`,
    'g',
  );
  const coincidencias = [...fragmento.matchAll(raiz)];
  if (coincidencias.length !== 1) {
    throw new Error(
      `${punto.archivo} debe contener exactamente una raíz id="${punto.tab}" class="tab-content"`,
    );
  }
  const otrasRaices = [...fragmento.matchAll(/class="tab-content(?:\s+active)?"/g)];
  if (otrasRaices.length !== 1) {
    throw new Error(`${punto.archivo} contiene más de una raíz tab-content`);
  }

  for (const match of fragmento.matchAll(/src="\.\.\/capturas\/([^"]+)"/g)) {
    const captura = join(DIR, '..', 'capturas', match[1]);
    if (!existsSync(captura)) {
      throw new Error(`${punto.archivo} referencia una captura inexistente: ${match[1]}`);
    }
  }

  const clase = punto.predeterminado ? 'tab-content active' : 'tab-content';
  const ajustado = fragmento.replace(
    new RegExp(`(<div\\s+id="${tab}"\\s+class=")tab-content(?:\\s+active)?(")`),
    `$1${clase}$2`,
  );
  return {
    ...punto,
    contenido: ajustado,
    bytes: Buffer.byteLength(fragmento),
    sha256: sha256(fragmento),
  };
}

function inyectarRouter(html, puntos) {
  const cierreBody = html.lastIndexOf('</body>');
  if (cierreBody < 0) throw new Error('La base compartida no tiene </body>');
  const rutas = Object.fromEntries(puntos.map((punto) => [punto.n, punto.tab]));

  const router = `
<!-- Generado por armar.mjs: rutas de ramas del simulador central. -->
<script>
(() => {
  const rutasPorPunto = ${JSON.stringify(rutas)};

  function seleccionarPuntoDesdeRuta() {
    const punto = new URLSearchParams(window.location.hash.slice(1)).get('punto');
    const tab = rutasPorPunto[punto];
    if (tab && typeof window.goTab === 'function') window.goTab(tab);
  }

  window.addEventListener('hashchange', seleccionarPuntoDesdeRuta);
  seleccionarPuntoDesdeRuta();
})();
</script>
`;
  return html.slice(0, cierreBody) + router + html.slice(cierreBody);
}

validarRegistro();
const puntos = PUNTOS.map(leerPunto);
const predeterminado = puntos.find((punto) => punto.predeterminado);
const botones = puntos
  .map((punto) => botonPunto(punto, punto.tab === predeterminado.tab))
  .map((boton) => `    ${boton}`)
  .join('\n');
const fragmentos = [...puntos]
  .sort((a, b) => a.ordenDom - b.ordenDom)
  .map((punto) => punto.contenido)
  .join('\n\n');
const inicio = readFileSync(INICIO, 'utf8');
const fin = readFileSync(FIN, 'utf8');
const central = `${inicio}${botones}\n  </div>\n\n\n${fragmentos}\n\n\n${fin}`;
const html = inyectarRouter(central, puntos);

writeFileSync(DESTINO, html, 'utf8');
writeFileSync(
  MANIFIESTO,
  `${JSON.stringify({
    generadoDesde: puntos.map(({ contenido: _contenido, ...punto }) => punto),
  }, null, 2)}\n`,
  'utf8',
);
console.log('escrito', DESTINO, 'desde', puntos.length, 'puntos');
