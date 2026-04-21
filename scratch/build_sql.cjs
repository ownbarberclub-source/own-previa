const fs = require('fs');
const data = JSON.parse(fs.readFileSync('extracted_db.json', 'utf8'));

let sql = `-- =============================================
--  SCHEMA: OWN PRÉVIA (COMISSÕES RLS)
-- =============================================

CREATE TABLE IF NOT EXISTS previa_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS previa_user_units (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  unit_id UUID REFERENCES previa_units(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, unit_id)
);

CREATE TABLE IF NOT EXISTS previa_barbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES previa_units(id),
  name TEXT NOT NULL,
  avulso_rate INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS previa_service_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES previa_units(id),
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_minutes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(unit_id, item_name)
);

CREATE TABLE IF NOT EXISTS previa_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES previa_units(id) UNIQUE,
  pot_rate NUMERIC DEFAULT 0,
  extra_rate NUMERIC DEFAULT 0,
  product_rate NUMERIC DEFAULT 10
);

CREATE TABLE IF NOT EXISTS previa_cycles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month_year TEXT NOT NULL UNIQUE,
  subscription_total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS previa_commission_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES previa_units(id),
  cycle_id UUID REFERENCES previa_cycles(id),
  barber_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  value NUMERIC DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  duration_minutes INT DEFAULT 0,
  service_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS previa_manual_minutes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID REFERENCES previa_cycles(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES previa_barbers(id) ON DELETE CASCADE,
  minutes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cycle_id, barber_id)
);

CREATE TABLE IF NOT EXISTS previa_historical_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID REFERENCES previa_cycles(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES previa_barbers(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES previa_units(id),
  subscription_minutes INT DEFAULT 0,
  subscription_count INT DEFAULT 0,
  subscription_commission NUMERIC DEFAULT 0,
  avulso_revenue NUMERIC DEFAULT 0,
  avulso_commission NUMERIC DEFAULT 0,
  avulso_count INT DEFAULT 0,
  extra_revenue NUMERIC DEFAULT 0,
  extra_commission NUMERIC DEFAULT 0,
  extra_count INT DEFAULT 0,
  product_revenue NUMERIC DEFAULT 0,
  product_commission NUMERIC DEFAULT 0,
  product_count INT DEFAULT 0,
  bebida_revenue NUMERIC DEFAULT 0,
  bebida_commission NUMERIC DEFAULT 0,
  bebida_count INT DEFAULT 0,
  total_commission NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cycle_id, barber_id)
);

-- RLS
ALTER TABLE previa_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE previa_user_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE previa_barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE previa_service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE previa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE previa_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE previa_commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE previa_manual_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE previa_historical_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura Todos" ON previa_units FOR SELECT USING (true);
CREATE POLICY "Leitura Todos" ON previa_barbers FOR SELECT USING (true);
CREATE POLICY "Leitura Todos" ON previa_service_types FOR SELECT USING (true);
CREATE POLICY "Leitura Todos" ON previa_settings FOR SELECT USING (true);
CREATE POLICY "Leitura Todos" ON previa_cycles FOR SELECT USING (true);
CREATE POLICY "Leitura Todos" ON previa_commission_records FOR SELECT USING (true);
CREATE POLICY "Leitura Todos" ON previa_manual_minutes FOR SELECT USING (true);
CREATE POLICY "Leitura Todos" ON previa_historical_results FOR SELECT USING (true);

CREATE POLICY "Modify Todos" ON previa_units FOR ALL USING (true);
CREATE POLICY "Modify Todos" ON previa_user_units FOR ALL USING (true);
CREATE POLICY "Modify Todos" ON previa_barbers FOR ALL USING (true);
CREATE POLICY "Modify Todos" ON previa_service_types FOR ALL USING (true);
CREATE POLICY "Modify Todos" ON previa_settings FOR ALL USING (true);
CREATE POLICY "Modify Todos" ON previa_cycles FOR ALL USING (true);
CREATE POLICY "Modify Todos" ON previa_commission_records FOR ALL USING (true);
CREATE POLICY "Modify Todos" ON previa_manual_minutes FOR ALL USING (true);
CREATE POLICY "Modify Todos" ON previa_historical_results FOR ALL USING (true);


-- =========================================================================
-- DADOS EXATOS EXTRAÍDOS DA BASE ORIGINAL (.env): UNIDADES, BARBEIROS E SERVIÇOS
-- =========================================================================
`;

// Inserir unidades
if (data.units && data.units.length > 0) {
  sql += "\nINSERT INTO previa_units (id, name) VALUES\n";
  sql += data.units.map(u => `('${u.id}', '${u.name.replace(/'/g, "''")}')`).join(',\n') + "\nON CONFLICT (id) DO NOTHING;\n";
  
  // Settings Default baseados nos IDs
  sql += "\nINSERT INTO previa_settings (unit_id, pot_rate, extra_rate, product_rate) VALUES\n";
  sql += data.units.map(u => `('${u.id}', 1.0, 0.5, 10.0)`).join(',\n') + "\nON CONFLICT (unit_id) DO NOTHING;\n";
}

// Inserir barbeiros
if (data.barbers && data.barbers.length > 0) {
  sql += "\nINSERT INTO previa_barbers (id, unit_id, name, avulso_rate) VALUES\n";
  sql += data.barbers.map(b => `('${b.id}', '${b.unit_id}', '${b.name.replace(/'/g, "''")}', ${b.avulso_rate})`).join(',\n') + "\nON CONFLICT (id) DO NOTHING;\n";
}

// Serviços em chunk limitados para query não falhar (caso passe do limite), mas 480 é suave.
if (data.services && data.services.length > 0) {
  sql += "\nINSERT INTO previa_service_types (id, unit_id, item_name, category, duration_minutes) VALUES\n";
  sql += data.services.map(s => {
    return `('${s.id}', '${s.unit_id}', '${s.item_name.replace(/'/g, "''")}', '${s.category.replace(/'/g, "''")}', ${s.duration_minutes})`;
  }).join(',\n') + "\nON CONFLICT (unit_id, item_name) DO NOTHING;\n";
}

fs.writeFileSync('../../previa_setup.sql', sql);
console.log('Arquivo ../../previa_setup.sql reescrito com ' + data.services.length + ' serviços originais!');
