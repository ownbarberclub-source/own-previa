const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tvjbtlsxibcpahpizksd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M'
);

async function check() {
  const { data, error } = await supabase
    .from('previa_records')
    .select('id, barber_name, item_name, value, commission, category')
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (error) {
    console.error(error);
  } else {
    console.table(data);
  }
}

check();
