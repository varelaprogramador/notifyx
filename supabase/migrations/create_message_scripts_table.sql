-- Criar a tabela message_scripts
CREATE TABLE message_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id TEXT NOT NULL
);

-- Adicionar índice para melhorar a performance de consultas por user_id
CREATE INDEX idx_message_scripts_user_id ON message_scripts(user_id);

-- Adicionar índice para busca por tags
CREATE INDEX idx_message_scripts_tags ON message_scripts USING GIN (tags);

-- Trigger para atualizar o timestamp de updated_at automaticamente
CREATE TRIGGER update_message_scripts_updated_at
BEFORE UPDATE ON message_scripts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentar a tabela e colunas
COMMENT ON TABLE message_scripts IS 'Tabela para armazenar scripts de mensagem pré-prontos';
COMMENT ON COLUMN message_scripts.id IS 'Identificador único do script';
COMMENT ON COLUMN message_scripts.name IS 'Nome do script de mensagem';
COMMENT ON COLUMN message_scripts.description IS 'Descrição opcional do script';
COMMENT ON COLUMN message_scripts.content IS 'Conteúdo do script de mensagem';
COMMENT ON COLUMN message_scripts.tags IS 'Tags para categorizar os scripts';
COMMENT ON COLUMN message_scripts.created_at IS 'Data e hora de criação do script';
COMMENT ON COLUMN message_scripts.updated_at IS 'Data e hora da última atualização do script';
COMMENT ON COLUMN message_scripts.user_id IS 'ID do usuário no Clerk que é proprietário deste script';

