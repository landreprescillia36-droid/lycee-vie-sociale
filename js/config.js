/* Réglages de la sauvegarde en ligne (Supabase).
   Laisse vide pour jouer sans compte : le bouton « Mon compte » n'apparaît pas.
   Pour l'activer : Supabase → Project Settings → API (ou « Connect »), copier
   « Project URL » et la clé « anon » / « publishable ». Cette clé est faite pour être
   publique : la sécurité vient des règles de supabase/schema.sql. Ne jamais mettre ici
   la clé « service_role » / « secret ». */
window.LYCEE_CONFIG = {
  supabaseUrl: 'https://xykuqrrtisxqzabmwcio.supabase.co',
  supabaseAnonKey: 'sb_publishable_vi__PBP6kx5y-XHmlufdUg_R6rMXpTj'
};
