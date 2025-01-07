CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.Manuale(
    Link TEXT PRIMARY KEY,
    Nome TEXT NOT NULL,
    storage_object_id uuid not null references storage.objects(id)
);

CREATE TABLE public.Prodotto_Manuale(
    Prodotto TEXT NOT NULL REFERENCES Prodotto(ID) ON DELETE CASCADE,
    Manuale TEXT NOT NULL REFERENCES Manuale(Link) ON DELETE CASCADE,
    PRIMARY KEY (Prodotto, Manuale)
);

CREATE VIEW manuale_percorso WITH (security_invoker=true)
AS
  SELECT Manuale.*, storage.objects.name AS storage_object_path
  FROM Manuale JOIN storage.objects ON (storage.objects.id = Manuale.storage_object_id);

CREATE TABLE public.Manuale_Sezione ( -- tabella relazione molti a molti
  Manuale TEXT NOT NULL REFERENCES Manuale(Link) ON DELETE CASCADE,
  NChunk INT NOT NULL,
  Contenuto TEXT NOT NULL,
  embedding vector (768),
  PRIMARY KEY (Manuale, NChunk)
);

CREATE INDEX ON public.Manuale_Sezione USING hnsw (embedding vector_ip_ops);

CREATE FUNCTION supabase_url()
RETURNS TEXT
language plpgsql
security definer
as $$
declare
  secret_value text;
begin
  select decrypted_secret into secret_value from vault.decrypted_secrets where name = 'supabase_url';
  return secret_value;
end;
$$;

CREATE VIEW prodotto_manuale_full WITH (security_invoker=true)
AS
  SELECT Prodotto.*, Prodotto_Manuale.Manuale as manuale
  FROM Prodotto JOIN Prodotto_Manuale ON (Prodotto.ID = Prodotto_Manuale.Prodotto);


CREATE OR REPLACE FUNCTION match_messaggi (query_embedding vector(768))
returns TABLE (
  content TEXT, 
  score FLOAT
)
language SQL
as $$
  SELECT risposta, 1-(Domanda_embedding <-> query_embedding) as score
  FROM private.Messaggio
  WHERE 1-(Domanda_embedding <-> query_embedding) > 0.58
  ORDER BY score ASC
  LIMIT  5;
$$;

CREATE OR REPLACE FUNCTION match_qea (query_embedding vector(768))
returns TABLE (
  content TEXT, 
  score FLOAT
)
language SQL
as $$
  SELECT risposta, 1-(Domanda_embedding <-> query_embedding) as score
  FROM public.QeA
  WHERE 1-(Domanda_embedding <-> query_embedding) > 0.58
  ORDER BY score ASC
  LIMIT  5;
$$;

CREATE OR REPLACE FUNCTION match_manuale (query_embedding vector(768), documents text[] )
returns TABLE (
  Manuale TEXT,
  NChunk INT,
  content TEXT, 
  score FLOAT
)
language SQL
as $$
  SELECT Manuale, NChunk, Contenuto, 1-(embedding <-> query_embedding) as score
  FROM public.Manuale_Sezione
  WHERE 1-(embedding <=> query_embedding) > 0.58 AND Manuale = ANY(documents)
  ORDER BY score ASC
  LIMIT  5;
$$;

CREATE OR REPLACE FUNCTION get_pdf_id(pdf TEXT)
RETURNS TEXT
LANGUAGE plpgsql
as $$
BEGIN
  RETURN (
    SELECT Nome
    FROM public.Manuale
    WHERE Link = pdf
  );
END;
$$;