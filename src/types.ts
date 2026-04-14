// Unidade (Filial)
export interface Unit {
  id: string;
  name: string;
  created_at?: string;
}

// Vínculo entre Usuário e Unidade
export interface UserUnitAssignment {
  user_id: string;
  unit_id: string;
}

// Barbeiro cadastrado no sistema
export interface Barber {
  id: string;
  unit_id: string;
  name: string;
  avulso_rate: number;
  created_at?: string;
}

// Tipo de serviço mapeado da planilha do AppBarber
export interface ServiceType {
  id: string;
  unit_id: string;
  item_name: string;
  category: 'assinatura' | 'avulso' | 'extra' | 'produto' | 'bebida' | 'ignorar';
  duration_minutes: number;
  created_at?: string;
}

// Configurações gerais da empresa (por unidade)
export interface Settings {
  id: string;
  unit_id: string;
  pot_rate: number;
  extra_rate: number;
  product_rate: number;
}

// Ciclo mensal (Global para todas as unidades)
export interface Cycle {
  id: string;
  month_year: string;
  subscription_total: number;
  status?: 'open' | 'closed';
  created_at?: string;
}

export interface HistoricalResult {
  id: string;
  cycle_id: string;
  barber_id: string;
  unit_id: string;
  subscription_minutes: number;
  subscription_count: number;
  subscription_commission: number;
  avulso_revenue: number;
  avulso_commission: number;
  avulso_count: number;
  extra_revenue: number;
  extra_commission: number;
  extra_count: number;
  product_revenue: number;
  product_commission: number;
  product_count: number;
  bebida_revenue: number;
  bebida_commission: number;
  bebida_count: number;
  total_commission: number;
  created_at?: string;
}

// Registro individual lido da planilha
export interface CommissionRecord {
  id: string;
  unit_id: string;
  cycle_id: string;
  barber_name: string;
  item_name: string;
  category: string;
  value: number;
  commission: number;
  duration_minutes: number;
  service_date: string;
  created_at?: string;
}

// Resultado calculado por barbeiro
export interface BarberResult {
  barber: Barber;
  unit_name?: string; // Para a visão consolidada
  subscriptionMinutes: number;
  avulsoRevenue: number;
  extraRevenue: number;
  productRevenue: number;
  bebidaRevenue: number;
  subscriptionCommission: number;
  avulsoCommission: number;
  extraCommission: number;
  productCommission: number;
  bebidaCommission: number;

  // Contadores para Rankings e Simulador
  subscriptionCount: number;
  avulsoCount: number;
  extraCount: number;
  productCount: number;
  bebidaCount: number;

  totalCommission: number;
  projectedCommission: number;
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  is_authorized: boolean;
  created_at?: string;
}
export interface ManualMinutes {
  id: string;
  cycle_id: string;
  barber_id: string;
  minutes: number;
  created_at?: string;
}
