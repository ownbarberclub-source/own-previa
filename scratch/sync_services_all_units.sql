-- 1. Garantir que exista um índice único para evitar duplicados
-- Isso permite que o ON CONFLICT funcione corretamente
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_service_unit_item') THEN
        ALTER TABLE commission_services ADD CONSTRAINT uq_service_unit_item UNIQUE (unit_id, item_name);
    END IF;
END $$;

-- 2. Clonar serviços da Matriz para todas as outras unidades
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
