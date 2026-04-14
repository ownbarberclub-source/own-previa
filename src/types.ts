// Barbeiro cadastrado no sistema
export interface Barber {
  id: string;
  name: string;
  avulso_rate: number;   // ex: 0.25 = 25% de comissão nos avulsos
  created_at?: string;
}

// Tipo de serviço mapeado da planilha do AppBarber
export interface ServiceType {
  id: string;
  item_name: string;                          // nome exato como aparece na coluna "Item" da planilha
  category: 'assinatura' | 'avulso' | 'extra' | 'produto' | 'ignorar';
  duration_minutes: number;                   // duração em minutos (para cálculo do POT de assinaturas)
  created_at?: string;
}

// Configurações gerais da empresa
export interface Settings {
  id: string;
  pot_rate: number;       // % do total de assinaturas que vai ao POT dos barbeiros (ex: 0.40 = 40%)
  extra_rate: number;     // % de comissão geral para extras (ex: 0.10 = 10%)
  product_rate: number;   // % de comissão geral para bebidas/produtos (ex: 0.10 = 10%)
}

// Ciclo mensal
export interface Cycle {
  id: string;
  month_year: string;          // ex: "2026-04"
  subscription_total: number;  // total arrecadado em assinaturas (manual)
  created_at?: string;
}

// Registro individual lido da planilha
export interface CommissionRecord {
  id: string;
  cycle_id: string;
  barber_name: string;
  item_name: string;
  category: string;
  value: number;
  duration_minutes: number;
  service_date: string;
  created_at?: string;
}

// Resultado calculado por barbeiro
export interface BarberResult {
  barber: Barber;
  subscriptionMinutes: number;
  avulsoRevenue: number;
  extraRevenue: number;
  productRevenue: number;
  subscriptionCommission: number;
  avulsoCommission: number;
  extraCommission: number;
  productCommission: number;
  totalCommission: number;
  projectedCommission: number;
}
