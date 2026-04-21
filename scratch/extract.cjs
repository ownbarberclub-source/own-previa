const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const URL = 'https://vvrhkroovijyfsnjyact.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cmhrcm9vdmlqeWZzbmp5YWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDEwNzIsImV4cCI6MjA5MTY3NzA3Mn0.8iYMfU3FDCYbt1SOBHOOJ1JgueWMsy47md4zujVZ1DM';
const sb = createClient(URL, KEY);

async function extract() {
  console.log('Extraindo...');
  const { data: units } = await sb.from('commission_units').select('*');
  const { data: barbers } = await sb.from('commission_barbers').select('*');
  const { data: services } = await sb.from('commission_services').select('*');
  
  fs.writeFileSync('extracted_db.json', JSON.stringify({ units, barbers, services }, null, 2));
  console.log('Salvo em extracted_db.json com ' + services?.length + ' serviços e ' + barbers?.length + ' barbeiros.');
}

extract().catch(console.error);
