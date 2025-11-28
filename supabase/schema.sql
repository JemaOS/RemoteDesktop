-- Jema Remote Desktop - Supabase Schema
-- This SQL script creates the necessary tables for session management
-- Run this in your Supabase SQL Editor

-- Table des sessions RDP
CREATE TABLE IF NOT EXISTS rdp_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(8) NOT NULL UNIQUE,
  host_peer_id VARCHAR(50),
  client_peer_id VARCHAR(50),
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'connected', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches par code
CREATE INDEX IF NOT EXISTS idx_rdp_sessions_code ON rdp_sessions(code);

-- Index pour le nettoyage des sessions expirées
CREATE INDEX IF NOT EXISTS idx_rdp_sessions_expires_at ON rdp_sessions(expires_at);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_rdp_sessions_updated_at ON rdp_sessions;
CREATE TRIGGER update_rdp_sessions_updated_at
  BEFORE UPDATE ON rdp_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS (Row Level Security)
ALTER TABLE rdp_sessions ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion anonyme
CREATE POLICY "Allow anonymous insert" ON rdp_sessions
  FOR INSERT
  WITH CHECK (true);

-- Politique pour permettre la lecture anonyme
CREATE POLICY "Allow anonymous select" ON rdp_sessions
  FOR SELECT
  USING (true);

-- Politique pour permettre la mise à jour anonyme
CREATE POLICY "Allow anonymous update" ON rdp_sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Politique pour permettre la suppression anonyme (pour le nettoyage)
CREATE POLICY "Allow anonymous delete" ON rdp_sessions
  FOR DELETE
  USING (expires_at < NOW());

-- Activer les notifications en temps réel pour la table
ALTER PUBLICATION supabase_realtime ADD TABLE rdp_sessions;

-- Fonction pour nettoyer les sessions expirées (à appeler via un cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM rdp_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE rdp_sessions IS 'Table des sessions de bureau à distance';
COMMENT ON COLUMN rdp_sessions.code IS 'Code de session à 6-8 caractères';
COMMENT ON COLUMN rdp_sessions.host_peer_id IS 'ID PeerJS de l''hôte';
COMMENT ON COLUMN rdp_sessions.client_peer_id IS 'ID PeerJS du client';
COMMENT ON COLUMN rdp_sessions.status IS 'État de la session: waiting, active, connected, closed';
COMMENT ON COLUMN rdp_sessions.expires_at IS 'Date d''expiration de la session (1 heure par défaut)';