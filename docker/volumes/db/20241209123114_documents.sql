CREATE EXTENSION IF NOT EXISTS vector;

-- Creation bucket for files
insert into storage.buckets (id, name)
values ('files', 'files')
on conflict do nothing;


-- Table for manuals
CREATE TABLE public.Manuale(
    Link TEXT PRIMARY KEY,
    Nome TEXT NOT NULL,
    storage_object_id uuid not null references storage.objects(id)
);

-- Table of N-N relationship between products and manuals
CREATE TABLE public.Prodotto_Manuale(
    Prodotto TEXT NOT NULL REFERENCES Prodotto(ID) ON DELETE CASCADE,
    Manuale TEXT NOT NULL REFERENCES Manuale(Link) ON DELETE CASCADE,
    PRIMARY KEY (Prodotto, Manuale)
);

-- View to show the path of the manual
CREATE VIEW manuale_percorso WITH (security_invoker=true)
AS
  SELECT Manuale.*, storage.objects.name AS storage_object_path
  FROM Manuale JOIN storage.objects ON (storage.objects.id = Manuale.storage_object_id);

-- Table for manual chunks
CREATE TABLE public.Manuale_Sezione ( -- tabella relazione molti a molti
  Manuale TEXT NOT NULL REFERENCES Manuale(Link) ON DELETE CASCADE,
  NChunk INT NOT NULL,
  Contenuto TEXT NOT NULL,
  embedding vector (768),
  PRIMARY KEY (Manuale, NChunk)
);

CREATE INDEX ON public.Manuale_Sezione USING hnsw (embedding vector_ip_ops);