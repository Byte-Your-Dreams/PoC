select vault.create_secret(
  'http://kong:8000',
  'supabase_url'
);

select vault.create_scret(
  'http://ollama:11434',
  'AI_INFERNCE_API_HOST'
);
create function private.embed() 
returns trigger 
language plpgsql
as $$
declare
  url text;
  result int;
begin
  IF NEW.embedding IS NULL OR Old.Contenuto <> NEW.Contenuto THEN
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
  end if;
  return null;
end;
$$;

create trigger embed_document_sections
  after insert or update on public.Manuale_Sezione
  for each row
  execute procedure private.embed();