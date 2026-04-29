const XLSX = require('xlsx');

const filePath = 'C:\\Users\\User\\Downloads\\AppBarber  Relatório Gerencial Financeiro (13).xlsx';

try {
  const wb = XLSX.readFile(filePath);
  const wsname = wb.SheetNames[0];
  console.log('Sheet name:', wsname);
  const ws = wb.Sheets[wsname];
  const data = XLSX.utils.sheet_to_json(ws);
  console.log('Total rows parsed:', data.length);
  
  if (data.length > 0) {
    const keys = Object.keys(data[0]);
    console.log('Columns found:', keys.join(', '));
  }
  
  // Imprimir as ultimas linhas pra ver se tem algo estranho
  if (data.length >= 475) {
    console.log('Row 475:', data[474]);
    console.log('Row 476:', data[475]);
    console.log('Row 477:', data[476]);
  }
  
  // Imprimir as ultimas mesmo se for menos
  console.log('Last row:', data[data.length - 1]);
  
} catch (e) {
  console.error('Error reading file:', e.message);
}
