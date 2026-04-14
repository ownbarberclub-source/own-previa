-- Tabela de Perfis Geenciais
CREATE TABLE IF NOT EXISTS commission_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer', -- 'admin', 'editor', 'viewer'
  is_authorized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Realtime para as tabelas principais
-- Nota: Isso deve ser feito via painel do Supabase se o SQL não tiver permissão
-- ALTER PUBLICATION supabase_realtime ADD TABLE commission_barbers;
-- ALTER PUBLICATION supabase_realtime ADD TABLE commission_settings;
-- ALTER PUBLICATION supabase_realtime ADD TABLE commission_services;
-- ALTER PUBLICATION supabase_realtime ADD TABLE commission_cycles;
-- ALTER PUBLICATION supabase_realtime ADD TABLE commission_records;
-- ALTER PUBLICATION supabase_realtime ADD TABLE commission_profiles;
