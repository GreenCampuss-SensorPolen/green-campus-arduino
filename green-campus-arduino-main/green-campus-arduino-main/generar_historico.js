const fs = require('fs');

const DIAS_HISTORICO = 90;
const ID_TEMP = 1;
const ID_CO2 = 2;

// --- CONFIGURACIÓN EXACTA DE TU PGADMIN ---
const NOMBRE_TABLA = 'reading'; 
const COLUMNA_NODO = 'nodeId';
const COLUMNA_VALOR = 'value';
const COLUMNA_FECHA = 'time'; // <-- ¡Aquí estaba la clave!

console.log(`🚀 Generando archivo SQL para ${DIAS_HISTORICO} días...`);
let sqlStatements = [];

for (let d = DIAS_HISTORICO; d >= 0; d--) {
  const fechaActual = new Date();
  fechaActual.setDate(fechaActual.getDate() - d);
  const esFinDeSemana = fechaActual.getDay() === 0 || fechaActual.getDay() === 6;

  for (let h = 0; h < 24; h++) {
    const fechaLectura = new Date(fechaActual);
    fechaLectura.setHours(h, 0, 0, 0);
    const fechaSQL = fechaLectura.toISOString();

    let temp = 18.0 + (Math.sin((h - 8) * Math.PI / 12) * 3);
    let co2 = 400.0;

    if (!esFinDeSemana && h >= 8 && h <= 20) {
      co2 += 500 + Math.random() * 300;
      temp += 2 + Math.random() * 1.5;
    } else {
      co2 += Math.random() * 40;
      temp += Math.random() * 1;
    }

    temp = temp.toFixed(2);
    co2 = co2.toFixed(0);

    // Creamos la sentencia SQL (Las comillas dobles protegen las mayúsculas de Postgres)
    sqlStatements.push(`INSERT INTO "${NOMBRE_TABLA}" ("${COLUMNA_NODO}", "${COLUMNA_VALOR}", "${COLUMNA_FECHA}") VALUES (${ID_TEMP}, ${temp}, '${fechaSQL}');`);
    sqlStatements.push(`INSERT INTO "${NOMBRE_TABLA}" ("${COLUMNA_NODO}", "${COLUMNA_VALOR}", "${COLUMNA_FECHA}") VALUES (${ID_CO2}, ${co2}, '${fechaSQL}');`);
  }
}

fs.writeFileSync('historico.sql', sqlStatements.join('\n'));
console.log(`🎉 ¡Archivo historico.sql generado con éxito! (${sqlStatements.length} registros)`);