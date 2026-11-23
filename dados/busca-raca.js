// Casa o que a pessoa digitou em "Outra raça" com o banco RACAS_TODAS.
// 1) normaliza (minúscula, sem acento, só letras) -> 2) chave fonética do português (sh/ch/sch->x, y->i, k/qu->c, z->s,
// w->v, ph->f, h mudo some, letras dobradas viram uma) -> 3) igual a um apelido? -> 4) um contém o outro? -> 5) distância
// de edição (Damerau-Levenshtein) com nota de 0 a 1. Abaixo de 0,72 = "sem casamento" (vai para a pergunta do porte).
(function () {
  function normal(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function fonetica(s) {
    let t = normal(s).replace(/\b(cachorro|cao|cachorra|cadela|raca|da raca|meu|minha|e|eh|um|uma|tipo|parece|acho que|acho)\b/g, ' ');
    t = t.replace(/(\w{4,}?)(zinho|zinha|inho|inha)\b/g, '$1'); // pinsherzinho -> pinsher
    t = t.replace(/\s+/g, '');
    t = t.replace(/sch/g, 'x').replace(/sc(?=[ei])/g, 's').replace(/sh/g, 'x').replace(/ch/g, 'x').replace(/ph/g, 'f').replace(/th/g, 't')
      .replace(/qu/g, 'c').replace(/k/g, 'c').replace(/y/g, 'i').replace(/w/g, 'v').replace(/z/g, 's').replace(/ç/g, 's')
      .replace(/h/g, '').replace(/(.)\1+/g, '$1');
    return t;
  }
  const PARECIDAS = new Set(['sx', 'xs', 'sc', 'cs', 'ie', 'ei', 'ou', 'uo', 'mn', 'nm', 'lr', 'rl']);
  function dice(a, b) { // semelhança por pares de letras
    const pa = [], pb = []; for (let i = 0; i < a.length - 1; i++) pa.push(a.slice(i, i + 2)); for (let i = 0; i < b.length - 1; i++) pb.push(b.slice(i, i + 2));
    if (!pa.length || !pb.length) return 0; let c = 0; const usados = pb.slice();
    for (const p of pa) { const k = usados.indexOf(p); if (k >= 0) { c++; usados.splice(k, 1); } }
    return 2 * c / (pa.length + pb.length);
  }
  function dist(a, b) { // Damerau-Levenshtein (troca de vizinhas conta 1; som parecido conta 0,5)
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    const d = Array.from({ length: m + 1 }, (_, i) => [i].concat(Array(n).fill(0)));
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : PARECIDAS.has(a[i - 1] + b[j - 1]) ? 0.5 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[m][n];
  }
  let INDICE = null;
  function indice() {
    if (INDICE) return INDICE;
    INDICE = [];
    (window.RACAS_TODAS || []).forEach(([nome, porte, ficha, apelidos], i) => {
      [nome].concat(apelidos || []).forEach(a => { const k = fonetica(a); if (k) INDICE.push({ k, i, nome, porte, ficha }); });
    });
    return INDICE;
  }
  // devolve { texto, chave, raca:{nome,porte,ficha}|null, metodo, nota, sugestoes:[{nome,porte,ficha,nota}] }
  function buscarRaca(texto) {
    const chave = fonetica(texto), idx = indice();
    const r = { texto, chave, raca: null, metodo: 'sem_casamento', nota: 0, sugestoes: [] };
    if (chave.length < 2) return r;
    const melhor = new Map(); // por raça, a melhor nota
    for (const e of idx) {
      let nota = 0, met = '';
      if (e.k === chave) { nota = 1; met = 'apelido'; }
      else if (chave.length >= 4 && e.k.length >= 4 && (e.k.includes(chave) || chave.includes(e.k))) {
        nota = 0.9 * Math.min(e.k.length, chave.length) / Math.max(e.k.length, chave.length) + 0.1; met = 'parcial';
      } else {
        const d = dist(chave, e.k), lev = 1 - d / Math.max(chave.length, e.k.length);
        nota = 0.6 * lev + 0.4 * dice(chave, e.k); met = 'aproximado';
      }
      const atual = melhor.get(e.i);
      if (!atual || nota > atual.nota) melhor.set(e.i, { nome: e.nome, porte: e.porte, ficha: e.ficha, nota, met });
    }
    const lista = [...melhor.values()].sort((a, b) => b.nota - a.nota);
    r.sugestoes = lista.slice(0, 3).filter(s => s.nota >= 0.55).map(s => ({ nome: s.nome, porte: s.porte, ficha: s.ficha, nota: +s.nota.toFixed(2) }));
    const top = lista[0];
    if (top && top.nota >= 0.68) {
      r.raca = { nome: top.nome, porte: top.porte, ficha: top.ficha }; r.metodo = top.met; r.nota = +top.nota.toFixed(2);
      // mistura de duas raças ("shitzu com poodle"): marca o método, fica com a 1ª que casou
      const segunda = lista[1];
      if (/\b(com|e|mix|mistura|cruzado|cruza)\b/.test(normal(texto)) && segunda && segunda.nota >= 0.72) r.metodo = 'mistura';
    }
    return r;
  }
  // Sugestões pelo COMEÇO do nome, para aparecer já na 2ª letra ("bo" -> Boxer, Border Collie, Boston...).
  // Compara pelo texto normal e pela chave fonética (assim "xi" acha Shih Tzu e Chihuahua).
  function sugerirPorInicio(texto, n) {
    const t = normal(texto), k = fonetica(texto); if (t.length < 2) return [];
    const out = [];
    (window.RACAS_TODAS || []).forEach(([nome, porte, ficha, apelidos]) => {
      // pontos: 3 = o nome oficial começa assim; 2 = um apelido inteiro começa assim (ou soa assim);
      // 1 = uma palavra do nome oficial começa assim ("pom" -> Lulu da Pomerânia). Palavra solta no meio de apelido não conta
      // (era o que fazia "do" achar "Bernese mountain dog" e "sh" achar "German shepherd").
      const nn = normal(nome); let pts = 0;
      if (nn.startsWith(t)) pts = 3;
      else if ((apelidos || []).some(a => normal(a).startsWith(t)) || (k.length >= 2 && [nome].concat(apelidos || []).some(a => fonetica(a).startsWith(k)))) pts = 2;
      else if (nn.split(' ').some(w => w.startsWith(t))) pts = 1;
      if (pts) out.push({ nome, porte, ficha, nota: 0.7, inicio: true, pts, pop: ficha ? 1 : 0 });
    });
    // mais pontos primeiro; empate: as que têm ficha (mais comuns) e depois ordem alfabética
    return out.sort((a, b) => b.pts - a.pts || b.pop - a.pop || a.nome.localeCompare(b.nome, 'pt')).slice(0, n || 4);
  }
  window.buscarRaca = buscarRaca; window._fonetica = fonetica; window.sugerirPorInicio = sugerirPorInicio;
  if (typeof module !== 'undefined') module.exports = { buscarRaca, fonetica };
})();
