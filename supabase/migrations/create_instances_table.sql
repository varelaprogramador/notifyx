-- Criar o tipo enum para os tipos de instância
CREATE TYPE instance_type AS ENUM ('whatsapp', 'instagram', 'telegram');

-- Criar a tabela instances
CREATE TABLE instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name TEXT NOT NULL,
  instance_id TEXT,
  token TEXT,
  status TEXT,
  qrcode TEXT,
  type instance_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id TEXT NOT NULL,
  config JSONB
);

-- Adicionar restrição de unicidade para instance_name por usuário
CREATE UNIQUE INDEX idx_instances_name_user ON instances(instance_name, user_id);

-- Adicionar índice para melhorar a performance de consultas por user_id
CREATE INDEX idx_instances_user_id ON instances(user_id);

-- Adicionar índice para melhorar a performance de consultas por status
CREATE INDEX idx_instances_status ON instances(status);

-- Trigger para atualizar o timestamp de updated_at automaticamente
CREATE TRIGGER update_instances_updated_at
BEFORE UPDATE ON instances
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentar a tabela e colunas
COMMENT ON TABLE instances IS 'Tabela para armazenar instâncias de mensageria como WhatsApp, Instagram, etc.';
COMMENT ON COLUMN instances.id IS 'Identificador único da instância';
COMMENT ON COLUMN instances.instance_name IS 'Nome da instância definido pelo usuário';
COMMENT ON COLUMN instances.instance_id IS 'ID da instância na API externa';
COMMENT ON COLUMN instances.token IS 'Token de autenticação da instância';
COMMENT ON COLUMN instances.status IS 'Status da conexão: connected, disconnected, connecting, error';
COMMENT ON COLUMN instances.qrcode IS 'QR Code para conexão (base64)';
COMMENT ON COLUMN instances.type IS 'Tipo da instância: whatsapp, instagram, telegram';
COMMENT ON COLUMN instances.created_at IS 'Data e hora de criação da instância';
COMMENT ON COLUMN instances.updated_at IS 'Data e hora da última atualização da instância';
COMMENT ON COLUMN instances.user_id IS 'ID do usuário no Clerk que é proprietário desta instância';
COMMENT ON COLUMN instances.config IS 'Configurações adicionais da instância em formato JSON';

