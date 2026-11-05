// logica.js — asignación de ejercicios por equipo y verificación del código.
// Funciona en el navegador y en Node (para las pruebas).
(function () {
  'use strict';
  var root = typeof window !== 'undefined' ? window : globalThis;

  // Cada equipo recibe siempre la misma combinación (no cambia al recargar).
  // Con 4 variantes en los ejercicios 1 y 2, los equipos 1 a 10 reciben
  // pares (variante ej.1, variante ej.2) todos distintos.
  function variantesDelEquipo(n, banco) {
    var i = n - 1;
    var L = banco.map(function (e) { return e.variantes.length; });
    var idx = [
      i % L[0],
      (Math.floor(i / L[0]) + i) % L[1],
      i % L[2],
      i % L[3]
    ];
    return banco.map(function (e, k) { return e.variantes[idx[k]]; });
  }

  function getSubtle() {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
      return globalThis.crypto.subtle;
    }
    if (typeof require === 'function') {
      return require('node:crypto').webcrypto.subtle;
    }
    return null;
  }

  async function sha256Hex(texto) {
    var subtle = getSubtle();
    if (!subtle) throw new Error('sin-crypto');
    var buf = await subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return Array.from(new Uint8Array(buf))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('');
  }

  // El dígito k del código se valida contra el hash de la variante k del equipo.
  async function verificar(n, banco, salt, codigo) {
    var vs = variantesDelEquipo(n, banco);
    if (!new RegExp('^\\d{' + vs.length + '}$').test(codigo)) return false;
    for (var k = 0; k < vs.length; k++) {
      var h = await sha256Hex(salt + '|' + (k + 1) + '|' + vs[k].id + '|' + codigo[k]);
      if (h !== vs[k].hash) return false;
    }
    return true;
  }

  root.Logica = { variantesDelEquipo: variantesDelEquipo, verificar: verificar };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Logica;
})();