-- Adicionar coluna 'status' na tabela de ciclos
ALTER TABLE public.commission_cycles ADD COLUMN IF NOT EXISTS status text default 'open';

-- Tabela para guardar os dados fechados (snapshot) do mês
create table if not exists public.commission_historical_results (
  id uuid default gen_random_uuid() primary key,
  cycle_id uuid references public.commission_cycles on delete cascade not null,
  barber_id uuid references public.commission_barbers on delete cascade not null,
  unit_id uuid references public.commission_units on delete cascade not null,
  
  subscription_minutes integer default 0,
  subscription_count integer default 0,
  subscription_commission numeric default 0,
  
  avulso_revenue numeric default 0,
  avulso_commission numeric default 0,
  avulso_count integer default 0,
  
  extra_revenue numeric default 0,
  extra_commission numeric default 0,
  extra_count integer default 0,
  
  product_revenue numeric default 0,
  product_commission numeric default 0,
  product_count integer default 0,
  
  bebida_revenue numeric default 0,
  bebida_commission numeric default 0,
  bebida_count integer default 0,
  
  total_commission numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Evitar duplicatas (um barbeiro só tem um fechamento por ciclo)
  unique (cycle_id, barber_id)
);

-- Habilitar RLS
alter table public.commission_historical_results enable row level security;

-- Permissões
create policy "Authorized users can view historical results"
  on public.commission_historical_results for select
  using (
    exists (
      select 1 from public.commission_profiles
      where id = auth.uid() and is_authorized = true
    )
  );

create policy "Admins and Editors can insert historical results"
  on public.commission_historical_results for insert
  with check (
    exists (
      select 1 from public.commission_profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

create policy "Admins and Editors can update historical results"
  on public.commission_historical_results for update
  using (
    exists (
      select 1 from public.commission_profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

create policy "Admins and Editors can delete historical results"
  on public.commission_historical_results for delete
  using (
    exists (
      select 1 from public.commission_profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- Garantir que Cycles podem ser atualizados
create policy "Admins and Editors can update cycles"
  on public.commission_cycles for update
  using (
    exists (
      select 1 from public.commission_profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );
