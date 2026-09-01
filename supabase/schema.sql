-- Compagnon BG3 — schéma pour les sessions de groupe (jointure par code).
--
-- Comment l'utiliser :
-- 1. Crée un projet gratuit sur https://supabase.com (aucune carte bancaire requise).
-- 2. Dans le menu de gauche, ouvre "SQL Editor" → "New query".
-- 3. Colle tout le contenu de ce fichier et clique sur "Run".
-- 4. Dans "Project Settings" → "Data API", récupère l'URL du projet et la clé "anon public".
-- 5. Colle ces deux valeurs dans un fichier .env.local à la racine du projet (voir .env.example).
--
-- Modèle de sécurité : aucune authentification n'est utilisée. Le code de session (6
-- caractères, tiré au hasard) fait office de "mot de passe" partagé entre les joueurs d'un
-- même groupe — cohérent avec un usage entre amis, sans données sensibles.

create table if not exists sessions (
  code text primary key,
  created_at timestamptz not null default now()
);

create table if not exists session_personnages (
  id uuid primary key,
  session_code text not null references sessions (code) on delete cascade,
  joueur_id uuid not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists session_personnages_session_code_idx
  on session_personnages (session_code);

alter table sessions enable row level security;
alter table session_personnages enable row level security;

drop policy if exists "lecture publique des sessions" on sessions;
create policy "lecture publique des sessions" on sessions
  for select using (true);

drop policy if exists "creation publique des sessions" on sessions;
create policy "creation publique des sessions" on sessions
  for insert with check (true);

drop policy if exists "lecture publique des personnages de session" on session_personnages;
create policy "lecture publique des personnages de session" on session_personnages
  for select using (true);

drop policy if exists "ecriture publique des personnages de session" on session_personnages;
create policy "ecriture publique des personnages de session" on session_personnages
  for insert with check (true);

drop policy if exists "mise a jour publique des personnages de session" on session_personnages;
create policy "mise a jour publique des personnages de session" on session_personnages
  for update using (true);

drop policy if exists "suppression publique des personnages de session" on session_personnages;
create policy "suppression publique des personnages de session" on session_personnages
  for delete using (true);

-- Nécessaire pour que les autres joueurs reçoivent les changements en direct.
alter publication supabase_realtime add table session_personnages;
