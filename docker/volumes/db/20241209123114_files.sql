CREATE EXTENSION IF NOT EXISTS vector;
insert into storage.buckets (id, name)
values ('files', 'files')
on conflict do nothing;
