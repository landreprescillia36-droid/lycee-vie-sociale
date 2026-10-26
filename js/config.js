/* Réglages de la sauvegarde en ligne (Supabase).
   Laisse vide pour jouer sans compte : le bouton « Mon compte » n'apparaît pas.
   Pour l'activer : Supabase → Project Settings → API (ou « Connect »), copier
   « Project URL » et la clé « anon » / « publishable ». Cette clé est faite pour être
   publique : la sécurité vient des règles de supabase/schema.sql. Ne jamais mettre ici
   la clé « service_role » / « secret ». */
window.LYCEE_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  /* Adresse du serveur IA (dossier serveur-ia/, sur Cloudflare), ex. https://lycee-ia.xxx.workers.dev
     Vide : les camarades répondent avec des phrases toutes faites. */
  aiUrl: ''
};
