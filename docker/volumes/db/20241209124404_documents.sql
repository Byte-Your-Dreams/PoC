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

-- This SQL script creates a function and a trigger to handle updates to storage objects.
-- 
-- Function: private.handle_storage_update()
-- - Triggered after an insert on the storage.objects table.
-- - Inserts a new record into the Manuale table with the name and storage ID from the new storage object.
-- - Sends an HTTP POST request to a specified URL with the inserted record's ID.
-- 
-- Trigger: on_file_upload
-- - Fires after an insert operation on the storage.objects table.
-- - Executes the private.handle_storage_update() function for each inserted row.
CREATE function private.handle_storage_update()
returns trigger
language plpgsql
as $$
declare
  Url TEXT;
  result INT;
begin
  select
    net.http_post(
      url := supabase_url() || '/functions/process',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', current_setting('request.headers')::json->>'authorization'
      ),
      body := jsonb_build_object(
        'Object', storage_object_id
      )
    )
  into result;

  return null;
end;
$$;

--CREATE trigger on_file_upload
--  AFTER INSERT OR UPDATE ON Manuale
--  FOR EACH ROW
-- EXECUTE PROCEDURE private.handle_storage_update();
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

CREATE OR REPLACE FUNCTION match_manuale (query_embedding vector(768))
returns TABLE (
  content TEXT, 
  score FLOAT
)
language SQL
as $$
  SELECT Contenuto, 1-(embedding <-> query_embedding) as score
  FROM public.Manuale_Sezione
  WHERE 1-(embedding <-> query_embedding) > 0.58
  ORDER BY score ASC
  LIMIT  5;
$$;



