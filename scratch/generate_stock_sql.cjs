const xlsx = require('xlsx');
const fs = require('fs');

const unitId = 'd1af48cb-14e6-4ae7-a6d2-e28207deeafa'; // Unidade Matriz
const excelPath = 'C:/Users/User/Downloads/AppBarber  Estoque.xlsx';
const outputPath = 'scratch/import_estoque_matriz.sql';

try {
  const wb = xlsx.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws);

  console.log(`Identificados ${data.length} itens no arquivo.`);

  let sql = `-- Script de Importação de Estoque (Matriz)\n`;
  sql += `-- Total de itens: ${data.length}\n\n`;
  
  // Primeiro, garantimos que a tabela aceite o ON CONFLICT sem erros se não houver constraint
  // Mas idealmente assumimos que o item_name deve ser único por unidade para mapeamento.
  
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
