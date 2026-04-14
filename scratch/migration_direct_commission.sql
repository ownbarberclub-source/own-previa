-- Adicionar coluna de comissão capturada da planilha
ALTER TABLE commission_records ADD COLUMN IF NOT EXISTS commission NUMERIC DEFAULT 0;
