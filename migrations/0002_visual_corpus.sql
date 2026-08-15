-- Visual corpus: canonical pictures/video of Flip Lab as it actually looks.
-- Files live on disk under docs/references/visual-corpus/. This table is the
-- backend index every agent and server fn must treat as the visual source of
-- truth (sibling Cloud Agent recordings are NOT visible unless ingested here).

create table if not exists visual_corpus (
  id text primary key,
  path text not null,
  kind text not null,
  surface text not null,
  title text not null,
  source text not null,
  notes text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists visual_corpus_kind_idx on visual_corpus (kind);
create index if not exists visual_corpus_surface_idx on visual_corpus (surface);
