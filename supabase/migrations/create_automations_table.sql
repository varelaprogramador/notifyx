-- Criar o tipo enum para os tipos de automação
CREATE TYPE automation_type AS ENUM ('webhook', 'api');

-- Criar a tabela automations
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type automation_type NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  config JSONB NOT NULL,
  logs JSONB,
  user_id TEXT NOT NULL
);

-- Adicionar índice para melhorar a performance de consultas por tipo
CREATE INDEX idx_automations_type ON automations(type);

-- Adicionar índice para melhorar a performance de consultas por status (ativo/inativo)
CREATE INDEX idx_automations_active ON automations(active);

-- Adicionar índice para melhorar a performance de consultas por user_id
CREATE INDEX idx_automations_user_id ON automations(user_id);

-- Função para atualizar o timestamp de updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp de updated_at automaticamente
CREATE TRIGGER update_automations_updated_at
BEFORE UPDATE ON automations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentar a tabela e colunas
COMMENT ON TABLE automations IS 'Tabela para armazenar automações como webhooks e integrações de API';
COMMENT ON COLUMN automations.id IS 'Identificador único da automação';
COMMENT ON COLUMN automations.name IS 'Nome descritivo da automação';
COMMENT ON COLUMN automations.type IS 'Tipo da automação: webhook ou api';
COMMENT ON COLUMN automations.active IS 'Indica se a automação está ativa ou não';
COMMENT ON COLUMN automations.created_at IS 'Data e hora de criação da automação';
COMMENT ON COLUMN automations.updated_at IS 'Data e hora da última atualização da automação';
COMMENT ON COLUMN automations.config IS 'Configurações da automação em formato JSON';
COMMENT ON COLUMN automations.logs IS 'Logs de execução da automação em formato JSON';
COMMENT ON COLUMN automations.user_id IS 'ID do usuário no Clerk que é proprietário desta automação';

