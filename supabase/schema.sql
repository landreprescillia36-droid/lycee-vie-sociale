-- Sauvegarde en ligne du jeu « Lycée · vie sociale ».
-- À coller une seule fois dans Supabase : SQL Editor → New query → Run.
-- Une ligne par compte : l'avatar et la partie (les mêmes données que le localStorage du jeu).

create table if not exists public.sauvegardes (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  avatar     jsonb,
  partie     jsonb,
  updated_at timestamptz not null default now()
);

-- Chaque joueur·se ne peut lire et écrire que sa propre sauvegarde.
alter table public.sauvegardes enable row level security;

drop policy if exists "lire sa sauvegarde" on public.sauvegardes;
create policy "lire sa sauvegarde" on public.sauvegardes
  for select using (auth.uid() = user_id);

drop policy if exists "créer sa sauvegarde" on public.sauvegardes;
create policy "créer sa sauvegarde" on public.sauvegardes
  for insert with check (auth.uid() = user_id);

drop policy if exists "modifier sa sauvegarde" on public.sauvegardes;
create policy "modifier sa sauvegarde" on public.sauvegardes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "supprimer sa sauvegarde" on public.sauvegardes;
create policy "supprimer sa sauvegarde" on public.sauvegardes
  for delete using (auth.uid() = user_id);
