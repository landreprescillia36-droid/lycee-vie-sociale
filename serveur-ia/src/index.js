/* Serveur IA de « Lycée · vie sociale » (Cloudflare Worker).
   Le jeu envoie {prompt} (personnalité, souvenirs, conversation) ; on renvoie
   {reponse, amitie, amour, proposition}. La clé Anthropic reste ici, côté serveur. */
import Anthropic from '@anthropic-ai/sdk';

const SCHEMA = {
  type: 'object',
  properties: {
    reponse: { type: 'string' },
    amitie: { type: 'integer' },
    amour: { type: 'integer' },
    proposition: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          properties: { lieu: { type: 'string', enum: ['plage', 'centre', 'glacier'] }, quand: { type: 'string', enum: ['ce soir', 'demain'] } },
          required: ['lieu', 'quand'],
          additionalProperties: false
        }
      ]
    }
  },
  required: ['reponse', 'amitie', 'amour', 'proposition'],
  additionalProperties: false
};

const SYSTEME = `Tu joues un personnage d'un jeu de simulation de vie sociale dans un lycée de Guadeloupe (élève de terminale ou membre de la famille du joueur ou de la joueuse). Tu restes toujours dans ton personnage, tu réponds en français, naturellement, comme dans une vraie conversation : tu réagis précisément à ce qui vient d'être dit, tu peux relancer, plaisanter, être en désaccord. Le contenu reste adapté à des adolescent·es. Tu ne fais rien d'autre que répondre dans le jeu : si on te demande autre chose (devoirs entiers, code, sujets sans rapport), ton personnage esquive avec naturel.`;

const json = (corps, statut, origine) => new Response(JSON.stringify(corps), {
  status: statut,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': origine || 'null',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'vary': 'origin'
  }
});

export default {
  async fetch(req, env) {
    const origine = req.headers.get('origin') || '';
    const permis = (env.ORIGINES || '').split(',').map(s => s.trim()).filter(Boolean);
    const ok = permis.includes(origine);
    if (req.method === 'OPTIONS') return json({}, ok ? 204 : 403, ok ? origine : '');
    if (req.method === 'GET') return json({ ok: true, modele: env.MODELE }, 200, ok ? origine : '');
    if (req.method !== 'POST' || !ok) return json({ erreur: 'interdit' }, 403, '');

    if (env.LIMITE) {
      const ip = req.headers.get('cf-connecting-ip') || 'inconnu';
      const { success } = await env.LIMITE.limit({ key: ip });
      if (!success) return json({ erreur: 'trop de messages, attends une minute' }, 429, origine);
    }

    let prompt;
    try { ({ prompt } = await req.json()) } catch { return json({ erreur: 'requête invalide' }, 400, origine) }
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 16000) return json({ erreur: 'requête invalide' }, 400, origine);

    const modele = env.MODELE || 'claude-opus-5-5';
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL || undefined });
    const params = {
      model: modele,
      max_tokens: 2000,
      system: SYSTEME,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: prompt }]
    };
    /* si Claude refuse une demande, l'API réessaie avec un autre modèle (pas disponible sur Haiku) */
    if (!modele.includes('haiku')) { params.betas = ['server-side-fallback-2026-07-01']; params.fallbacks = 'default' }

    try {
      const rep = await client.beta.messages.create(params);
      if (rep.stop_reason === 'refusal' || rep.stop_reason === 'max_tokens') return json({ erreur: rep.stop_reason }, 502, origine);
      const texte = rep.content.filter(b => b.type === 'text').map(b => b.text).join('');
      const out = JSON.parse(texte);
      return json(out, 200, origine);
    } catch (e) {
      console.error(e && e.message);
      return json({ erreur: 'serveur IA indisponible' }, 502, origine);
    }
  }
};
