-- functions fo question embedding
create function private.embed_message() 
returns trigger 
language plpgsql
as $$
declare
  url text;
  result int;
begin
    select
        net.http_post(
            url := supabase_url() || '/functions/v1/chat',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', current_setting('request.headers')::json->>'authorization'
            ),
            body := jsonb_build_object(
                'question', NEW.domanda,
                'id', NEW.id,
                'chat_id', NEW.chat
            )
        )
    into result;
    
  return null;
end;
$$;

-- trigger to embed the question
create trigger add_question
  after insert on public.Messaggio
  for each row
  execute procedure private.embed_message();

-- function to generate the response
-- create function private.generate_response() 
-- returns trigger 
-- language plpgsql
-- as $$
-- declare
--   url text;
--   result int;
-- begin
--   IF NEW.domanda_embedding IS NOT NULL THEN
--     select
--       net.http_post(
--         url := supabase_url() || '/functions/v1/chat',
--         headers := jsonb_build_object(
--             'Content-Type', 'application/json',
--             'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzM0NDc2NDAwLAogICJleHAiOiAxODkyMjQyODAwCn0.sAKa6ugHybSJQzPFpNyeglJdRBxHQ8l-A7Sj6fXH5X8'
--         ),
--         body := jsonb_build_object(
--             'query', NEW.domanda,
--             'query_embedding', NEW.domanda_embedding,
--             'id', NEW.id,
--             'chat_id', NEW.chat
--         )
--       )
--     into result;
--   END IF;
--   return null;
-- end;
-- $$;

-- trigger to generate the response
-- create trigger generate_response
--   after update on public.Messaggio
--   for each row
--   execute procedure private.generate_response(); 


CREATE OR REPLACE FUNCTION public.getlastmessages(chat_id uuid)
RETURNS jsonb 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'domanda', m.domanda,
        'risposta', m.risposta
      )
      ORDER BY m.createdat ASC
    )
    FROM (
      SELECT
        m.domanda,
        m.risposta,
        m.createdat
      FROM
        public.messaggio m
      WHERE
        m.chat = chat_id
      ORDER BY
        m.createdat DESC
      LIMIT 5
    ) AS m
  );
END;
$$;


