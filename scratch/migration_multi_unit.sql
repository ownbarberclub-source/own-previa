-- 1. Criar tabela de Unidades
CREATE TABLE IF NOT EXISTS commission_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar a Unidade Inicial "Matriz"
INSERT INTO commission_units (id, name) 
VALUES ('d1af48cb-14e6-4ae7-a6d2-e28207deeafa', 'Matriz')
ON CONFLICT DO NOTHING;

-- 3. Tabela de Vínculo Usuário x Unidades (Permissões)
CREATE TABLE IF NOT EXISTS commission_user_units (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  unit_id UUID REFERENCES commission_units ON DELETE CASCADE,
  PRIMARY KEY (user_id, unit_id)
);

-- 4. Adicionar unit_id às tabelas (EXCETO Cycles, que é global)
ALTER TABLE commission_barbers ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES commission_units(id);
ALTER TABLE commission_services ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES commission_units(id);
ALTER TABLE commission_settings ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES commission_units(id);
ALTER TABLE commission_records ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES commission_units(id);

-- 5. Vincular dados existentes à "Matriz"
UPDATE commission_barbers SET unit_id = 'd1af48cb-14e6-4ae7-a6d2-e28207deeafa' WHERE unit_id IS NULL;
UPDATE commission_services SET unit_id = 'd1af48cb-14e6-4ae7-a6d2-e28207deeafa' WHERE unit_id IS NULL;
UPDATE commission_settings SET unit_id = 'd1af48cb-14e6-4ae7-a6d2-e28207deeafa' WHERE unit_id IS NULL;
UPDATE commission_records SET unit_id = 'd1af48cb-14e6-4ae7-a6d2-e28207deeafa' WHERE unit_id IS NULL;

-- 6. Vincular usuários existentes à "Matriz"
INSERT INTO commission_user_units (user_id, unit_id)
SELECT id, 'd1af48cb-14e6-4ae7-a6d2-e28207deeafa' FROM commission_profiles
ON CONFLICT DO NOTHING;
