-- Adiciona a coluna unit_price na tabela previa_service_types
ALTER TABLE previa_service_types ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0;
