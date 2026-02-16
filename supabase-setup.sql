-- CRM Uptrix: Setup do banco de dados
-- Execute este SQL no Supabase SQL Editor (Database → SQL Editor)

-- Tabela de leads (compartilhada entre todos os usuários)
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  empresa TEXT DEFAULT '',
  notas TEXT DEFAULT '',
  vendedor TEXT DEFAULT '',
  stage TEXT DEFAULT 'novo',
  valor_proposta NUMERIC DEFAULT 0,
  atendeu_ligacao BOOLEAN DEFAULT FALSE,
  historico JSONB DEFAULT '[]',
  criado_em TIMESTAMPTZ DEFAULT now(),
  whatsapp_status TEXT DEFAULT 'nao_enviado',
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Se a tabela já existe, adicionar a coluna:
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_status TEXT DEFAULT 'nao_enviado';

-- Tabela de vendedores
CREATE TABLE IF NOT EXISTS vendedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL
);

-- Ativar Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;

-- Políticas: qualquer usuário autenticado tem acesso total
CREATE POLICY "Authenticated users full access on leads"
  ON leads FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access on vendedores"
  ON vendedores FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
