const xlsx = require('xlsx');
const fs = require('fs');

const unitId = 'e82dd995-6aa5-4ee6-bf69-26c4d975ff26'; // Unidade Efapi
const excelPath = 'C:/Users/User/Downloads/AppBarber  Estoque (1).xlsx';
const outputPath = 'scratch/import_estoque_efapi.sql';

try {
  const wb = xlsx.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws);

  console.log(`Identificados ${data.length} itens no arquivo para a unidade EFAPI.`);

  let sql = `-- Script de Importação de Estoque (EFAPI)\n`;
  sql += `-- Total de itens: ${data.length}\n\n`;
  
  sql += `INSERT INTO commission_services (unit_id, item_name, category, duration_minutes)\nVALUES\n`;

  const values = data.map(row => {
    const name = String(row['Descrição']).replace(/'/g, "''").trim();
    const cat = String(row['Categoria']).toLowerCase().includes('bebida') ? 'bebida' : 'produto';
    return `  ('${unitId}', '${name}', '${cat}', 0)`;
  });

  sql += values.join(',\n');
  sql += `\nON CONFLICT DO NOTHING;\n`;

  fs.writeFileSync(outputPath, sql);
  console.log(`Sucesso! Script gerado em ${outputPath}`);
} catch (e) {
  console.error('Erro ao processar planilha:', e.message);
  process.exit(1);
}
