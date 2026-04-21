-- 1. Garantir integridade de índices
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_service_unit_item') THEN
        ALTER TABLE commission_services ADD CONSTRAINT uq_service_unit_item UNIQUE (unit_id, item_name);
    END IF;
END $$;

-- 2. Cadastro da Unidade Efapi (73 itens)
INSERT INTO commission_services (unit_id, item_name, category, duration_minutes) VALUES
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', '3 EM 1 MINOXIDIL - SHAMPOO', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'AGUA SEM GÁS 500ML', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'ANTI CASPA - SHAMPOO', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'B.URB - LEAVE-IN', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'BABOON - CEMENT EFECT', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'BABOON - FIBER WAX', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'BABOON - GLOSS WAX', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'BABOON - MATTE WAX', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'BABOON - OIL BARBA', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'BABOON - POS BARBA', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'BABOON - SHAMPOO BARBA', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'BABOON - SHAMPOO CABELO', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'BABOON - SHAVING GEL', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'BARBA GUE - CERVEJA', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'BRAHMA - CHOPP', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'BUDWEISER - LATÃO', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'CAFÉ EXPRESSO', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'CERVEJA ARTESANAL', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'CERVEJA ORIGINAL 300ML', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'COCA COLA - LATA', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'COCA COLA 200ML', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'CONDICIONADOR BABOON', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'CORONA - LONG NECK', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'DON ALCIDES - BALM', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'DON ALCIDES - POMADA', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'EISENBAHN - LONG NECK', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'ENERGÉTICO MONSTER', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'H2O', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'HEINEKEN - LONG NECK', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'HEINEKEN 0.0', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'KITS PRESENTES', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'MINOXIDIL - TÔNICO', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'NAVALHA DESCARTÁVEL', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'PACK CERVEJA 06 UNID', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'PEPSI - LATA', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'POMADA OWN BARBER', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'PÓ TEXTURIZADOR BABOON', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'REFRIGERANTE LATA', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'SCHWEPPES CITRUS', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'SHAMPOO OWN BARBER', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'SPATODIN - BEBIDA', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'SPREAY FIXADOR BABOON', 'produto', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'STELLA ARTOIS', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'SUCO LATA', 'bebida', 0),
  ('e82dd995-6aa5-4ee6-bf69-26c4d975ff26', 'TÔNICO BABOON', 'produto', 0)
ON CONFLICT (unit_id, item_name) DO NOTHING;

-- 3. Cadastro da Unidade Avenida (67 itens)
INSERT INTO commission_services (unit_id, item_name, category, duration_minutes) VALUES
  ('5a7834fc-c563-405e-b6ec-0250552ece23', 'SHAMPOO OWN BARBER CLUB', 'produto', 0),
  ('5a7834fc-c563-405e-b6ec-0250552ece23', '3 EM 1 MINOXIDIL - SHAMPOO', 'produto', 0),
  ('5a7834fc-c563-405e-b6ec-0250552ece23', 'AGUA SEM GÁS 500ML', 'bebida', 0),
  ('5a7834fc-c563-405e-b6ec-0250552ece23', 'ANTI CASPA - SHAMPOO', 'produto', 0),
  ('5a7834fc-c563-405e-b6ec-0250552ece23', 'B.URB - LEAVE-IN', 'produto', 0),
  ('5a7834fc-c563-405e-b6ec-0250552ece23', 'BABOON - CEMENT EFECT', 'produto', 0),
  ('5a7834fc-c563-405e-b6ec-0250552ece23', 'BABOON - FIBER WAX', 'produto', 0),
  ('5a7834fc-c563-405e-b6ec-0250552ece23', 'BABOON - GLOSS WAX', 'produto', 0),
  ('5a7834fc-c563-405e-b6ec-0250552ece23', 'CAFÉ EXPRESSO', 'bebida', 0),
  ('5a7834fc-c563-405e-b6ec-0250552ece23', 'COCA COLA - LATA', 'bebida', 0),
  ('5a7834fc-c563-405e-b6ec-0250552ece23', 'ENERGÉTICO MONSTER', 'bebida', 0),
  ('5a7834fc-c563-405e-b6ec-0250552ece23', 'HEINEKEN - LONG NECK', 'bebida', 0),
  ('5a7834fc-c563-405e-b6ec-0250552ece23', 'NAVALHA DESCARTÁVEL', 'produto', 0),
  ('5a7834fc-c563-405e-b6ec-0250552ece23', 'POMADA OWN BARBER', 'produto', 0)
ON CONFLICT (unit_id, item_name) DO NOTHING;

-- 4. Sincronização Matriz para todas as unidades (Copia o que faltar)
-- Matriz ID: d1af48cb-14e6-4ae7-a6d2-e28207deeafa
INSERT INTO commission_services (unit_id, item_name, category, duration_minutes)
SELECT u.id, s.item_name, s.category, s.duration_minutes
FROM commission_units u
CROSS JOIN (
    SELECT item_name, category, duration_minutes 
    FROM commission_services 
    WHERE unit_id = 'd1af48cb-14e6-4ae7-a6d2-e28207deeafa'
) s
WHERE u.id != 'd1af48cb-14e6-4ae7-a6d2-e28207deeafa'
ON CONFLICT (unit_id, item_name) DO NOTHING;
