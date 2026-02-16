-- Rode este comando no SQL Editor do Supabase para criar a tabela de sessões do WhatsApp
create table if not exists whatsapp_sessions (
  id text primary key,
  data text
);

-- Habilita Row Level Security (opcional, mas recomendado)
alter table whatsapp_sessions enable row level security;

-- Cria uma política para permitir acesso total (ajuste conforme necessidade de segurança)
create policy "Enable all access for now" on whatsapp_sessions for all using (true) with check (true);
