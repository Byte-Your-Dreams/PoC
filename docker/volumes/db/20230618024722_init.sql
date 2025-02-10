CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS vector;

create schema private;
SET timezone = 'Europe/Rome';

-- Table for products
CREATE TABLE public.Prodotto(
    ID TEXT PRIMARY KEY,
    Nome TEXT NOT NULL,
    Descrizione TEXT NOT NULL,
    ETIM JSONB NOT NULL
);

-- Table for Q&A about products
CREATE TABLE QeA(
    Prodotto TEXT NOT NULL,
    Domanda TEXT NOT NULL,
    Domanda_embedding vector(768),
    Risposta TEXT NOT NULL,
    FOREIGN KEY (Prodotto) REFERENCES Prodotto(ID),
    PRIMARY KEY (Prodotto, Domanda)
); 

-- Table for chat
CREATE TABLE Chat(
    ID UUID PRIMARY KEY default uuid_generate_v4(),
    Utente UUID NOT NULL REFERENCES auth.users(ID) ON DELETE CASCADE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for messages
CREATE TABLE Messaggio(
    ID UUID PRIMARY KEY default uuid_generate_v4(),
    Chat UUID NOT NULL REFERENCES Chat(ID) ON DELETE CASCADE,
    Domanda TEXT NOT NULL,
    Domanda_embedding vector(768),
    Risposta TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Feedback_check BIT, -- null = non valutato, 0 = negativo, 1 = positivo
    Feedback_text TEXT -- usato per feedback negativi
);


-- RLS
--ALTER TABLE public.Chat ENABLE ROW LEVEL SECURITY;
--ALTER TABLE public.Messaggio ENABLE ROW LEVEL SECURITY;

--ALL chat
CREATE POLICY allow_to_control_chat
ON chat
FOR ALL
TO public
USING ( utente = auth.uid() )
WITH CHECK ( utente = auth.uid() );

--UPDATE chat
CREATE POLICY allow_to_update_chat
ON chat
FOR UPDATE
TO authenticated
USING (auth.uid() = utente);

--INSERT chat
CREATE POLICY enable_insert_for_users_based_on_user_id
ON chat
FOR INSERT
TO public
WITH CHECK ( auth.uid() = utente );

--SELECT chat
CREATE POLICY enable_read_access_for_all_users
ON chat
FOR SELECT
TO public
USING (true);

--INSERT messages
CREATE POLICY enable_insert_for_users_based_on_user_id
ON messaggio
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = (SELECT chat.utente FROM chat WHERE chat.id = messaggio.chat)
);

--SELECT messages
CREATE POLICY enable_read_access_for_all_users
ON messaggio
FOR SELECT
TO public
USING (true);

-- view get all conversations for front-end
CREATE VIEW get_all_conversations AS
  SELECT Chat.ID, Chat.Utente, Chat.CreatedAt, array_agg(
      json_build_object('id', m.id,
      'domanda', m.domanda,
      'risposta', m.risposta,
      'feedback_check', m.feedback_check,
      'feedback_text', m.feedback_text,
      'CreatedAt', m.CreatedAt) ORDER BY m.CreatedAt
    ) AS Messages
  FROM Chat LEFT JOIN Messaggio AS m ON Chat.ID = m.Chat
  GROUP BY Chat.ID, Chat.Utente, Chat.CreatedAt
  ORDER BY Chat.CreatedAt DESC;

CREATE OR REPLACE FUNCTION getAllConversations(userIN uuid)
RETURNS TABLE (
  ID uuid,
  Utente uuid,
  CreatedAt timestamp,
  Messages jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT Chat.ID, Chat.Utente, Chat.CreatedAt, array_agg(
      json_build_object('id', m.id,
      'domanda', m.domanda,
      'risposta', m.risposta,
      'feedback_check', m.feedback_check,
      'feedback_text', m.feedback_text,
      'CreatedAt', m.CreatedAt) ORDER BY m.CreatedAt
    ) AS Messages
  FROM Chat LEFT JOIN Messaggio AS m ON Chat.ID = m.ID
  WHERE Chat.Utente = userIN
  GROUP BY Chat.ID, Chat.Utente, Chat.CreatedAt
  ORDER BY Chat.CreatedAt DESC;
END;
$$ LANGUAGE plpgsql;