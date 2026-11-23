// Recebe os eventos do quiz (cada tela vista, cada resposta, VSL 90%, oferta, clique no checkout) e grava no Supabase.
// O navegador manda para /api/e (mesmo domínio do quiz), então bloqueador de anúncio não corta.
// Usa a chave PÚBLICA (anon) do projeto banco-de-ofertas: a tabela quiz_eventos só aceita INSERT dessa chave (ninguém lê).
// A leitura é pela função quiz_painel, que exige a chave do painel. SQL em sql/quiz_eventos.sql.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dxybmayffxvepmwbyezc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4eWJtYXlmZnh2ZXBtd2J5ZXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0ODY0OTksImV4cCI6MjEwNTA2MjQ5OX0.N5e2iynKyQ7z0xFVKSy4lAc7Fy9RulIAARrx_OtolIM';
const CAMPOS = ['quiz', 'variante', 'sid', 'tipo', 'etapa', 'resposta', 'dispositivo', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
  let corpo = req.body;
  try {
    if (typeof corpo === 'string') corpo = JSON.parse(corpo);
    if (Buffer.isBuffer(corpo)) corpo = JSON.parse(corpo.toString('utf8'));
    if (!corpo || typeof corpo !== 'object') {
      const pedacos = []; for await (const p of req) pedacos.push(p);
      corpo = JSON.parse(Buffer.concat(pedacos).toString('utf8') || '{}');
    }
  } catch (e) { res.statusCode = 400; return res.end(); }

  const base = {};
  for (const k of CAMPOS) if (corpo[k] != null && corpo[k] !== '') base[k] = String(corpo[k]).slice(0, k === 'resposta' ? 300 : 60);
  if (!base.tipo && corpo.ev) base.tipo = String(corpo.ev).slice(0, 30);
  if (!base.quiz) base.quiz = 'vovocao';
  if (!base.sid || !base.tipo) { res.statusCode = 400; return res.end(); }
  base.ordem = Number.isFinite(+corpo.ordem) && +corpo.ordem >= 0 ? Math.round(+corpo.ordem) : null;
  base.ms = Number.isFinite(+corpo.ms) ? Math.min(2147483647, Math.max(0, Math.round(+corpo.ms))) : null;
  base.pais = req.headers['x-vercel-ip-country'] || null;
  // resposta de múltipla escolha ("A | B") vira uma linha por opção, para o painel contar cada uma
  const linhas = base.tipo === 'resposta' && base.resposta && base.resposta.includes(' | ')
    ? base.resposta.split(' | ').map(r => ({ ...base, resposta: r.slice(0, 300) })) : [base];
  try {
    await fetch(SUPABASE_URL + '/rest/v1/quiz_eventos', {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(linhas),
    });
  } catch (e) { /* evento perdido não pode travar o quiz */ }
  res.statusCode = 204; res.end();
};
