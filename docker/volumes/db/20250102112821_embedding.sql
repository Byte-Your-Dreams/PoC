select vault.create_secret(
  'http://kong:8000',
  'supabase_url'
);
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

create trigger embed_document_sections
  after insert or update on public.Manuale_Sezione
  for each row
  execute procedure private.embed();