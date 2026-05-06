-- Adiciona campo de senha/cadastro do cliente (ex: Meu INSS)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS senha_cadastro TEXT;
