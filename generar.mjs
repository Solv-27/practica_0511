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

// ───────────────── Ejercicio 3: descomposición espectral (3×3 con un bloque 2×2) ─────────────────
// A tiene un bloque [[a,b],[b,a]] en las coordenadas i,j y el valor c en la coordenada k.
// Autovalores: a-b (u=(e_i-e_j)/√2), a+b (u=(e_i+e_j)/√2) y c (u=e_k).
// Dígito: entrada (i,j) del término del mayor autovalor, (a+b)·u·uᵀ  ->  (a+b)/2.
const bm3 = (M) => `\\begin{bmatrix}${M.map((r) => r.join('&')).join('\\\\')}\\end{bmatrix}`;

const ej3defs = [
  { id: 'a', par: [0, 1], a: 3, b: 1, c: 1 },
  { id: 'b', par: [0, 2], a: 4, b: 2, c: 3 },
  { id: 'c', par: [1, 2], a: 5, b: 3, c: 4 },
  { id: 'd', par: [0, 1], a: 6, b: 4, c: 5 },
];

claves.push('', 'EJERCICIO 3 (dígito = entrada (i,j) del término del mayor autovalor)');
const ej3 = ej3defs.map((d) => {
  const [i, j] = d.par;
  const k = [0, 1, 2].find((x) => x !== i && x !== j);
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  A[i][i] = d.a; A[j][j] = d.a; A[i][j] = d.b; A[j][i] = d.b; A[k][k] = d.c;

  const lMas = d.a + d.b, lMenos = d.a - d.b;
  assert.ok(d.b > 0, 'b > 0 para que el autovector del mayor sea (e_i+e_j)');
  assert.ok(lMas > d.c && lMas > lMenos, 'el mayor autovalor debe estar en el bloque');
  assert.equal(new Set([lMas, lMenos, d.c]).size, 3, 'autovalores distintos');

  // Verificación con vectores enteros: A w = λ w
  const mul = (v) => A.map((row) => row.reduce((s, x, t) => s + x * v[t], 0));
  const e = (n) => [0, 1, 2].map((t) => (t === n ? 1 : 0));
  const wMas = e(i).map((x, t) => x + e(j)[t]);
  const wMenos = e(i).map((x, t) => x - e(j)[t]);
  assert.deepEqual(mul(wMas), wMas.map((x) => lMas * x), 'A w+ != (a+b) w+');
  assert.deepEqual(mul(wMenos), wMenos.map((x) => lMenos * x), 'A w- != (a-b) w-');
  assert.deepEqual(mul(e(k)), e(k).map((x) => d.c * x), 'A e_k != c e_k');

  // 2A = (a+b) w+w+ᵀ + (a-b) w-w-ᵀ + 2c e_k e_kᵀ   (los w tienen norma² = 2)
  for (let r = 0; r < 3; r++) {
    for (let s = 0; s < 3; s++) {
      const suma = lMas * wMas[r] * wMas[s] + lMenos * wMenos[r] * wMenos[s] + 2 * d.c * e(k)[r] * e(k)[s];
      assert.equal(suma, 2 * A[r][s], `descomposición espectral falla en (${r},${s})`);
    }
  }

  const termino = (lMas * wMas[i] * wMas[j]) / 2; // (a+b)·(1/√2)(1/√2)
  assert.ok(Number.isInteger(termino) && termino >= 0 && termino <= 9, 'dígito inválido');
  digitos[`3|${d.id}`] = termino;
  const fila = (M) => '[' + M.map((r) => '[' + r.join(', ') + ']').join(', ') + ']';
  claves.push(
    `  ${d.id}) A = ${fila(A)}, autovalores ${[lMenos, lMas, d.c].sort((x, y) => x - y).join(', ')}`,
    `     mayor autovalor = ${lMas}, u = (e${i + 1}+e${j + 1})/√2;  término = ${lMas}/2·(1 en las posiciones (${i + 1},${i + 1}), (${i + 1},${j + 1}), (${j + 1},${i + 1}), (${j + 1},${j + 1}));  dígito = entrada (${i + 1},${j + 1}) = ${termino}`
  );

  const enunciado =
    `Sea \\(A=${bm3(A)}\\).` +
    `<ol>` +
    `<li>Hallá una matriz ortogonal \\(P\\) y una matriz diagonal \\(D\\) tales que \\(A=PDP^{T}\\), con los autovalores de menor a mayor en \\(D\\).</li>` +
    `<li>Escribí la descomposición espectral \\(A=\\lambda_1u_1u_1^{T}+\\lambda_2u_2u_2^{T}+\\lambda_3u_3u_3^{T}\\).</li>` +
    `</ol><strong>Tu dígito es la entrada \\((${i + 1},${j + 1})\\) de \\(\\lambda_3u_3u_3^{T}\\).</strong>`;
  return { id: d.id, enunciado, digito: termino };
});
assert.equal(new Set(ej3.map((e) => e.digito)).size, ej3.length, 'ej3: dígitos repetidos');

// ───────────────── Ejercicio 4: optimización restringida (Q sobre la circunferencia unidad) ─────────────────
// Q = a·x1² + 2b·x1x2 + c·x2²;  máximo de Q con x1²+x2²=1  =  mayor autovalor de [[a,b],[b,c]].
const ej4defs = [
  { id: 'a', a: 4, b: 4, c: -2 },
  { id: 'b', a: 6, b: 3, c: -2 },
  { id: 'c', a: 6, b: 4, c: 0 },
  { id: 'd', a: 8, b: 3, c: 0 },
];

claves.push('', 'EJERCICIO 4 (dígito = máximo de Q con x1²+x2²=1)');
const ej4 = ej4defs.map((d) => {
  const m = (d.a + d.c) / 2, p = (d.a - d.c) / 2;
  const r = Math.sqrt(p * p + d.b * d.b);
  assert.ok(Number.isInteger(r), 'autovalores no enteros');
  const lMax = m + r, lMin = m - r;
  assert.ok(Number.isInteger(lMax) && lMax >= 0 && lMax <= 9, 'dígito inválido');

  // chequeo numérico por fuerza bruta sobre la circunferencia
  let mx = -Infinity, mn = Infinity;
  for (let t = 0; t < 200000; t++) {
    const th = (2 * Math.PI * t) / 200000, x = Math.cos(th), y = Math.sin(th);
    const v = d.a * x * x + 2 * d.b * x * y + d.c * y * y;
    if (v > mx) mx = v;
    if (v < mn) mn = v;
  }
  assert.ok(Math.abs(mx - lMax) < 1e-6 && Math.abs(mn - lMin) < 1e-6, 'máximo/mínimo numéricos no coinciden');

  const Q = poly(d.a, 2 * d.b, d.c);
  digitos[`4|${d.id}`] = lMax;
  claves.push(`  ${d.id}) Q = ${Q.replace(/_/g, '').replace(/\^2/g, '²')};  A = [[${d.a}, ${d.b}], [${d.b}, ${d.c}]];  autovalores ${lMin} y ${lMax};  máximo = ${lMax} (dígito), mínimo = ${lMin}`);

  const enunciado =
    `Sea \\(Q(x_1,x_2)=${Q}\\). Hallá el máximo y el mínimo de \\(Q\\) sujeto a \\(x_1^2+x_2^2=1\\).` +
    `<br><strong>Tu dígito es el valor máximo.</strong>`;
  return { id: d.id, enunciado, digito: lMax };
});
assert.equal(new Set(ej4.map((e) => e.digito)).size, ej4.length, 'ej4: dígitos repetidos');

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
  { n: 3, titulo: 'Descomposición espectral', variantes: variantes(3, ej3) },
  { n: 4, titulo: 'Optimización restringida', variantes: variantes(4, ej4) },
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
  assert.match(c, /^\d{4}$/, `equipo ${n}: código mal formado (${c})`);
  assert.ok(!vistos.has(c), `código repetido en equipo ${n}: ${c}`);
  vistos.add(c);
  assert.ok(await Logica.verificar(n, banco, SALT, c), `equipo ${n}: el código correcto no verifica`);
  const mal = c.slice(0, 3) + String((Number(c[3]) + 1) % 10);
  assert.ok(!(await Logica.verificar(n, banco, SALT, mal)), `equipo ${n}: aceptó un código incorrecto`);
  const vs = Logica.variantesDelEquipo(n, banco);
  claves.push(`  Equipo ${n}: ${c}   (variantes ${vs.map((v) => v.id).join(', ')})`);
}

writeFileSync('claves.txt', claves.join('\n') + '\n');
console.log(claves.join('\n'));
console.log('\nOK: matemática verificada, códigos únicos para los equipos 1 a ' + MAX_EQUIPOS);
