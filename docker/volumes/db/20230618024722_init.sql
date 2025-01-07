CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS vector;

create schema private;

CREATE TABLE public.Prodotto(
    ID TEXT PRIMARY KEY,
    Nome TEXT NOT NULL,
    Descrizione TEXT NOT NULL,
    ETIM JSONB NOT NULL
);

CREATE TABLE private.Chat(
    ID UUID PRIMARY KEY,
    Utente UUID NOT NULL REFERENCES auth.users(ID) ON DELETE CASCADE,
    Data TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE private.Messaggio(
    ID UUID PRIMARY KEY,
    Chat UUID NOT NULL REFERENCES private.Chat(ID) ON DELETE CASCADE,
    Domanda TEXT NOT NULL,
    Domanda_embedding vector(768),
    Risposta TEXT NOT NULL,
    Feedback_check BIT, -- null = non valutato, 0 = negativo, 1 = positivo
    Feedback_text TEXT -- usato per feedback negativi
);

-- RLS
ALTER TABLE private.Chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY insert_chat ON private.Chat
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY select_own_chats ON private.Chat
FOR SELECT
USING (auth.uid() = Utente);

CREATE POLICY delect_own_chats ON private.Chat
FOR DELETE
USING (auth.uid() = Utente);

CREATE POLICY insert_messaggio ON private.Messaggio
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

    -- CREATE TABLE public.Manuale(
    --     Link TEXT PRIMARY KEY,
    --     Nome TEXT NOT NULL
    -- ); 
    -- CREATE TABLE Prodotto_Manuale(
    --     Prodotto TEXT NOT NULL,
    --     Manuale TEXT NOT NULL,
    --     FOREIGN KEY (Prodotto) REFERENCES Prodotto(ID),
    --     FOREIGN KEY (Manuale) REFERENCES Manuale(Link),
    --     PRIMARY KEY (Prodotto, Manuale)
    -- );
CREATE TABLE QeA(
    Prodotto TEXT NOT NULL,
    Domanda TEXT NOT NULL,
    Domanda_embedding vector(768),
    Risposta TEXT NOT NULL,
    FOREIGN KEY (Prodotto) REFERENCES Prodotto(ID),
    PRIMARY KEY (Prodotto, Domanda)
); 
