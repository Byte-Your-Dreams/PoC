
-- function to match the query with messages
CREATE OR REPLACE FUNCTION match_messaggi (query_embedding vector(768))
returns TABLE (
  content TEXT, 
  score FLOAT
)
language SQL
as $$
  SELECT risposta, 1-(Domanda_embedding <=> query_embedding) as score
  FROM Messaggio
  WHERE 1-(Domanda_embedding <=> query_embedding) > 0.58
  ORDER BY score ASC
  LIMIT  5;
$$;

-- function to match the query with Q&A !!! DA MODIFICARE
CREATE OR REPLACE FUNCTION match_qea (query_embedding vector(768))
returns TABLE (
  content TEXT, 
  score FLOAT
)
language SQL
as $$
  SELECT risposta, 1-(Domanda_embedding <=> query_embedding) as score
  FROM public.QeA
  WHERE 1-(Domanda_embedding <=> query_embedding) > 0.58
  ORDER BY score ASC
  LIMIT  5;
$$;


-- function to match the query with chunks
CREATE OR REPLACE FUNCTION match_manuale (query_embedding vector(768), documents text[])
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
DECLARE
  doc text;
  best_chunks TEXT[];
  highest_similarity float := 0;
  current_similarity float;
  current_chunks TEXT[];
BEGIN
  FOR doc IN SELECT unnest(documents)
  LOOP
    current_chunks := ARRAY[]::TEXT[];
    current_similarity := 0;

    SELECT array_agg(Contenuto), SUM(newT.similarity)
    INTO current_chunks, current_similarity
    FROM (
      SELECT ms.Contenuto, 1 - (ms.embedding <=> query_embedding) AS similarity
      FROM public.Manuale_Sezione AS ms 
      WHERE 1 - (ms.embedding <=> query_embedding) > 0.5 AND ms.Manuale = doc
      ORDER BY similarity DESC
      LIMIT 5
    ) AS newT;

    IF current_similarity > highest_similarity THEN
      highest_similarity := current_similarity;
      best_chunks := current_chunks;
    END IF;
  END LOOP;

  RETURN best_chunks;
END;
$$;

CREATE OR REPLACE FUNCTION getPdfKey(input TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
as $$
DECLARE
  output TEXT[];
BEGIN
  SELECT array_agg(Prodotto_Manuale.Manuale) INTO output 
  FROM Prodotto JOIN Prodotto_Manuale ON (Prodotto.ID = Prodotto_Manuale.Prodotto)
  WHERE Prodotto.Nome = input;

  RETURN output;
END;
$$;