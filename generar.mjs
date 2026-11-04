// generar.mjs — FUENTE DE VERDAD del banco de ejercicios.
// CONTIENE LAS RESPUESTAS EN CLARO: NO subir este archivo ni claves.txt al repo público.
// Uso:  node generar.mjs
//   -> escribe ejercicios.js (público, solo hashes) y claves.txt (privado, para vos)

import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const Logica = require('./logica.js');

const SALT = 'caja-fuerte-algebra-2026';
const MAX_EQUIPOS = 10;

const hash = (ej, id, digito) =>
  createHash('sha256').update(`${SALT}|${ej}|${id}|${digito}`).digest('hex');

const digitos = {}; // "ej|id" -> dígito (solo para pruebas y claves.txt)
const claves = []; // líneas de claves.txt

// ───────────────────────── Ejercicio 1: definida positiva ─────────────────────────
const bm = (a, b, c, d) => `\\begin{bmatrix}${a}&${b}\\\\${c}&${d}\\end{bmatrix}`;

const ej1 = [
  { id: 'a', inc: 'b', f: (t) => [[1, t], [t, 9]], tex: bm(1, 'b', 'b', 9), digito: 3, pdArriba: false },
  { id: 'b', inc: 'c', f: (t) => [[2, 4], [4, t]], tex: bm(2, 4, 4, 'c'), digito: 8, pdArriba: true },
  { id: 'c', inc: 'b', f: (t) => [[4, t], [t, 9]], tex: bm(4, 'b', 'b', 9), digito: 6, pdArriba: false },
  { id: 'd', inc: 'c', f: (t) => [[t, 6], [6, 9]], tex: bm('c', 6, 6, 9), digito: 4, pdArriba: true },
];

const det2 = (M) => M[0][0] * M[1][1] - M[0][1] * M[1][0];
const esPD = (M) => M[0][0] > 0 && det2(M) > 0;

claves.push('EJERCICIO 1 (dígito = valor crítico positivo de la incógnita)');
for (const e of ej1) {
  const d = e.digito;
  assert.ok(Math.abs(det2(e.f(d))) < 1e-9, `ej1 ${e.id}: det no se anula en ${d}`);
  assert.ok(esPD(e.f(e.pdArriba ? d + 0.1 : d - 0.1)), `ej1 ${e.id}: debería ser PD dentro`);
  assert.ok(!esPD(e.f(e.pdArriba ? d - 0.1 : d + 0.1)), `ej1 ${e.id}: no debería ser PD fuera`);
  digitos[`1|${e.id}`] = d;
  claves.push(`  ${e.id}) ${e.inc} crítico = ${d}  (PD ${e.pdArriba ? `si ${e.inc} > ${d}` : `si |${e.inc}| < ${d}`})`);
}
assert.equal(new Set(ej1.map((e) => e.digito)).size, ej1.length, 'ej1: dígitos repetidos');

// ───────────────── Ejercicio 2: cambio de variable y coordenadas de un punto ─────────────────
// v1 = autovector (de norma 5) del autovalor menor l1; v2 = ortogonal, con 1ª componente > 0.
const ej2defs = [
  { id: 'a', v1: [3, 4], l1: 1, l2: 26, x0: [5, 5], digito: 7, clase: 'definida positiva' },
  { id: 'b', v1: [4, 3], l1: -10, l2: 15, x0: [1, 2], digito: 2, clase: 'indefinida' },
  { id: 'c', v1: [3, -4], l1: 2, l2: 27, x0: [7, -1], digito: 5, clase: 'definida positiva' },
  { id: 'd', v1: [4, -3], l1: -30, l2: -5, x0: [9, -3], digito: 9, clase: 'definida negativa' },
];

function poly(a, b, c) {
  const terms = [[a, 'x_1^2'], [b, 'x_1x_2'], [c, 'x_2^2']].filter(([k]) => k !== 0);
  return terms
    .map(([k, v], i) => {
      const abs = Math.abs(k);
      const coef = abs === 1 ? '' : String(abs);
      if (i === 0) return (k < 0 ? '-' : '') + coef + v;
      return (k < 0 ? ' - ' : ' + ') + coef + v;
    })
    .join('');
}

claves.push('', 'EJERCICIO 2 (dígito = y1, primera coordenada de P^T x0)');
const ej2 = ej2defs.map((d) => {
  const [p, q] = d.v1;
  assert.equal(p * p + q * q, 25);
  assert.ok(d.l1 < d.l2, 'autovalores en orden creciente');
  const v2 = q > 0 ? [q, -p] : [-q, p];
  assert.ok(v2[0] > 0, 'v2 con primera componente positiva');

  const A = [[0, 0], [0, 0]];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const num = d.l1 * d.v1[i] * d.v1[j] + d.l2 * v2[i] * v2[j];
      assert.ok(num % 25 === 0, 'A no es entera');
      A[i][j] = num / 25;
    }
  }
  // A v1 = l1 v1 y A v2 = l2 v2
  const mul = (v) => [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];
  const Av1 = mul(d.v1), Av2 = mul(v2);
  assert.ok(Av1[0] === d.l1 * p && Av1[1] === d.l1 * q, 'A v1 != l1 v1');
  assert.ok(Av2[0] === d.l2 * v2[0] && Av2[1] === d.l2 * v2[1], 'A v2 != l2 v2');

  const y1 = (p * d.x0[0] + q * d.x0[1]) / 5;
  const y2 = (v2[0] * d.x0[0] + v2[1] * d.x0[1]) / 5;
  assert.ok(Number.isInteger(y1) && Number.isInteger(y2), 'coordenadas no enteras');
  assert.equal(y1, d.digito, `ej2 ${d.id}: y1 != dígito`);

  const Q = poly(A[0][0], 2 * A[0][1], A[1][1]);
  digitos[`2|${d.id}`] = d.digito;
  claves.push(
    `  ${d.id}) Q = ${Q.replace(/_/g, '').replace(/\^2/g, '²')}   [${d.clase}]`,
    `     A = [[${A[0][0]}, ${A[0][1]}], [${A[1][0]}, ${A[1][1]}]], autovalores ${d.l1} y ${d.l2}`,
    `     P = (1/5)·[[${p}, ${v2[0]}], [${q}, ${v2[1]}]]  (columnas: v1 para ${d.l1}, v2 para ${d.l2})`,
    `     nueva forma: ${d.l1}·y1² + ${d.l2}·y2²;  x0 = (${d.x0}) -> y0 = (${y1}, ${y2});  dígito = ${y1}`
  );

  const enunciado =
    `Sea \\(Q(x_1,x_2)=${Q}\\).` +
    `<ol>` +
    `<li>Clasificá la forma cuadrática.</li>` +
    `<li>Hallá una matriz ortogonal \\(P\\) tal que el cambio de variable \\(\\mathbf{x}=P\\mathbf{y}\\) elimine el término cruzado y escribí la nueva forma cuadrática. ` +
    `Convención para que \\(P\\) sea única: los autovalores van en orden creciente \\(\\lambda_1&lt;\\lambda_2\\) (una columna por autovalor) y cada columna tiene su primera componente no nula positiva.</li>` +
    `<li>Calculá las nuevas coordenadas \\(\\mathbf{y}_0=P^{T}\\mathbf{x}_0=(y_1,y_2)\\) del punto \\(\\mathbf{x}_0=(${d.x0[0]},${d.x0[1]})\\).</li>` +
    `</ol><strong>Tu dígito es \\(y_1\\).</strong>`;
  return { id: d.id, enunciado, digito: d.digito };
});
assert.equal(new Set(ej2.map((e) => e.digito)).size, ej2.length, 'ej2: dígitos repetidos');

// ───────────────── Ejercicios 3 y 4: espacio reservado ─────────────────
const placeholder = (n) => [{
  id: 'p',
  enunciado: `<em>Ejercicio ${n}: pendiente de cargar.</em> Por ahora su dígito es <strong>0</strong>.`,
  digito: 0,
}];
const ej3 = placeholder(3);
const ej4 = placeholder(4);
digitos['3|p'] = 0;
digitos['4|p'] = 0;

// ───────────────────────── Armado del banco público ─────────────────────────
const variantes = (n, lista, enunciadoDe) =>
  lista.map((e) => ({
    id: e.id,
    enunciado: enunciadoDe ? enunciadoDe(e) : e.enunciado,
    hash: hash(n, e.id, e.digito),
  }));

const banco = [
  {
    n: 1,
    titulo: 'Definida positiva',
    variantes: variantes(1, ej1, (e) =>
      `¿Para qué valores de \\(${e.inc}\\) la matriz \\(S=${e.tex}\\) es definida positiva? ` +
      `Hay un valor crítico positivo de \\(${e.inc}\\) en el que \\(S\\) deja de serlo. <strong>Tu dígito es ese valor.</strong>`),
  },
  { n: 2, titulo: 'Cambio de variable', variantes: variantes(2, ej2) },
  { n: 3, titulo: 'Pendiente', variantes: variantes(3, ej3) },
  { n: 4, titulo: 'Pendiente', variantes: variantes(4, ej4) },
];

writeFileSync(
  'ejercicios.js',
  `// Generado por generar.mjs — no editar a mano.\n` +
  `window.CONFIG = ${JSON.stringify({ MAX_EQUIPOS, SALT })};\n` +
  `window.BANCO = ${JSON.stringify(banco, null, 2)};\n`
);

// ───────────────────────── Pruebas de consistencia ─────────────────────────
const codigoDe = (n) =>
  Logica.variantesDelEquipo(n, banco).map((v, k) => digitos[`${k + 1}|${v.id}`]).join('');

claves.push('', 'CÓDIGO POR EQUIPO (ej.1, ej.2, ej.3, ej.4)');
const vistos = new Set();
for (let n = 1; n <= MAX_EQUIPOS; n++) {
  const c = codigoDe(n);
  assert.ok(!vistos.has(c), `código repetido en equipo ${n}: ${c}`);
  vistos.add(c);
  assert.ok(await Logica.verificar(n, banco, SALT, c), `equipo ${n}: el código correcto no verifica`);
  const mal = c.slice(0, 3) + String((Number(c[3]) + 1) % 10);
  assert.ok(!(await Logica.verificar(n, banco, SALT, mal)), `equipo ${n}: aceptó un código incorrecto`);
  const vs = Logica.variantesDelEquipo(n, banco);
  claves.push(`  Equipo ${n}: ${c}   (ej.1 variante ${vs[0].id}, ej.2 variante ${vs[1].id})`);
}
claves.push('', 'Nota: los dígitos de los ejercicios 3 y 4 son provisorios (0) hasta que se carguen.');

writeFileSync('claves.txt', claves.join('\n') + '\n');
console.log(claves.join('\n'));
console.log('\nOK: matemática verificada, códigos únicos para los equipos 1 a ' + MAX_EQUIPOS);
