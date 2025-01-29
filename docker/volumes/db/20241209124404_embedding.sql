CREATE EXTENSION IF NOT EXISTS vector;

-- secret for the supabase url
select vault.create_secret(
  'http://kong:8000',
  'supabase_url'
);

select vault.create_secret(
  'http://ollama:11434/v1',
  'AI_INFERENCE_API_HOST'
);


-- function to get the supabase url
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

-- function to embed the document sections
CREATE EXTENSION IF NOT EXISTS vector;
create function private.embed() 
returns trigger 
language plpgsql
as $$
declare
  url text;
  result int;
begin
  If NEW.embedding IS NULL OR OLD.Contenuto <> NEW.Contenuto THEN
    select
      net.http_post(
        url := supabase_url() || '/functions/v1/embed',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', current_setting('request.headers')::json->>'authorization'
        ),
        body := jsonb_build_object(
          'content', NEW.Contenuto,
          'manuale', NEW.Manuale,
          'n_chunk', NEW.NChunk 
        )
      )
    into result;
  END IF;
  return null;
end;
$$;

-- trigger to embed the document sections
create trigger embed_document_sections
  after insert or update on public.Manuale_Sezione
  for each row
  execute procedure private.embed();