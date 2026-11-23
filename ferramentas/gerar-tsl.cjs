// Gera dados/tsl-racas.js (as dores da TSL por raça) a partir de pesquisa/cao-idoso/racas/racas.json.
//   node ferramentas/gerar-tsl.cjs
// Para cada ficha do quiz: até 3 doenças (sem obesidade: a oferta é longevidade, não peso),
// com o número do estudo em linguagem simples (ou null se a pesquisa não tem número) e o sinal que o dono vê em casa.
const fs = require('fs'), path = require('path');
const R = require(path.join(__dirname, '..', '..', '..', 'pesquisa', 'cao-idoso', 'racas', 'racas.json'));
global.window = {}; require(path.join(__dirname, '..', 'dados', 'racas-quiz.js')); const F = window.FICHAS;
const lista = Array.isArray(R) ? R : Object.values(R.racas || R);

// o número de cada doença, reescrito à mão para ficar curto e certo (fonte: frequencia no racas.json)
const DADO = {
  'SRD (vira-lata) — porte pequeno|Doença da válvula do coração ("sopro")': 'Até 85% dos cães pequenos têm lesão na válvula aos 13 anos',
  'SRD (vira-lata) — porte pequeno|Doença da gengiva e dos dentes': 'A doença mais diagnosticada em cães: 1 em cada 8 por ano',
  'SRD (vira-lata) — porte médio|Câncer': 'Metade dos cães com mais de 10 anos vai ter câncer',
  'SRD (vira-lata) — porte médio|Artrose (dor nas articulações)': '4 em cada 10 já têm artrose no raio-X, e quase nenhum é tratado',
  'SRD (vira-lata) — porte grande|Artrose (dor nas articulações)': '4 em cada 10 já têm artrose no raio-X, e quase nenhum é tratado',
  'SRD (vira-lata) — porte grande|Rompimento do ligamento do joelho': 'A doença hereditária que mais aparece em vira-lata, mais até que em raça pura',
  'SRD (vira-lata) — porte grande|Câncer de osso': 'O risco cresce com o peso do corpo: típico de cão grande',
  'Shih Tzu|Doença da gengiva e dos dentes': 'A doença mais comum da raça: 1 em cada 10 por ano',
  'Shih Tzu|Doença da válvula do coração ("sopro")': 'Quase 3x mais chance que um vira-lata',
  'Yorkshire Terrier|Doença da gengiva e dos dentes': '98% já tinham gengivite com 9 meses de vida',
  'Yorkshire Terrier|Colapso de traqueia': 'Entre as 5 raças que mais morrem de doença respiratória',
  'Yorkshire Terrier|Doença renal crônica': 'A 2ª causa de morte mais registrada na raça',
  'Spitz Alemão Anão (Lulu da Pomerânia)|Doença da válvula do coração ("sopro")': 'Até 85% dos cães pequenos têm lesão na válvula aos 13 anos',
  'Pinscher (Pinscher miniatura)|Doença neurológica (coluna/cérebro)': 'Entre as 5 raças que mais morrem de doença neurológica',
  'Pinscher (Pinscher miniatura)|Doença da válvula do coração ("sopro")': 'Até 85% dos cães pequenos têm lesão na válvula aos 13 anos',
  'Maltês|Doença da válvula do coração ("sopro")': 'Entre as 5 raças que mais morrem do coração',
  'Poodle (toy e médio/miniatura)|Doença da gengiva e dos dentes': 'O Poodle toy tem 4x mais chance de doença na gengiva',
  'Poodle (toy e médio/miniatura)|Doença da válvula do coração ("sopro")': 'Cerca de 3x mais chance que um vira-lata',
  'Dachshund (salsicha / teckel)|Hérnia de disco': '1 em cada 5 tem hérnia de disco na vida: 10x mais que outras raças',
  'Chihuahua|Doença da válvula do coração ("sopro")': '6x mais chance que um vira-lata, e a principal causa de morte da raça',
  'Chihuahua|Doença da gengiva e dos dentes': 'A doença mais comum da raça: 1 em cada 7 por ano',
  'Chihuahua|Colapso de traqueia': '1 em cada 6 mortes da raça é respiratória',
  'Cavalier King Charles Spaniel|Doença da válvula do coração ("sopro")': '47x mais chance que um vira-lata',
  'Schnauzer miniatura|Inflamação do pâncreas': '3 em cada 4 Schnauzers têm gordura alta no sangue aos 10 anos',
  'Pug|Falta de ar do focinho curto': 'A principal causa de morte da raça',
  'Pug|Fraqueza progressiva das patas de trás': 'Cerca de 1 em cada 20 mortes da raça',
  'Pug|Convulsões / encefalite do Pug': 'Cerca de 1 em cada 15 mortes da raça',
  'Bulldog Francês|Falta de ar do focinho curto': '31x mais chance que outras raças',
  'Bulldog Francês|Hérnia de disco': 'A maior chance de hérnia de disco entre as raças puras nos EUA',
  'Bulldog Inglês|Insolação': '13x mais chance de insolação que um Labrador',
  'Bulldog Inglês|Doença do coração': 'A principal causa de morte registrada na raça',
  'Beagle|Câncer': 'A principal causa de morte da raça: 1 em cada 5',
  'Cocker Spaniel (inglês e americano)|Câncer': 'A principal causa de morte da raça',
  'Border Collie|Doença da válvula do coração ("sopro")': 'Cerca de 2x mais chance que um vira-lata',
  'Golden Retriever|Câncer dos vasos sanguíneos (baço/coração)': 'O câncer mais comum nos Goldens: 1 em cada 4 dos casos',
  'Golden Retriever|Câncer dos gânglios': 'O 2º câncer mais comum da raça',
  'Labrador Retriever|Artrose (dor nas articulações)': '1 em cada 4 mortes da raça vem de ossos e articulações',
  'Labrador Retriever|Câncer': '1 em cada 5 mortes da raça é câncer',
  'Pastor Alemão|Artrose (dor nas articulações)': 'Entre os 5 problemas mais comuns da raça',
  'Pastor Alemão|Paralisia progressiva das patas de trás': '1 em cada 7 mortes da raça: "não conseguia mais ficar de pé"',
  'Rottweiler|Câncer de osso': '26x o risco de um vira-lata',
  'Rottweiler|Rompimento do ligamento do joelho': '5x o risco de outras raças',
  'Rottweiler|Câncer dos gânglios': '1 em cada 3 mortes da raça é câncer',
  'Boxer|Outros cânceres (linfoma, tumor cerebral)': 'O câncer é a principal causa de morte da raça',
  'Dálmata|Pedra na bexiga': 'Quase todo Dálmata nasce com a tendência a pedra',
};
const ICONE = [[/acidente/i, '🚗'], [/vasos sanguíneos/i, '🩸'], [/coração|sopro|arritmia/i, '❤️'], [/gengiva|\bdentes?\b/i, '🦷'], [/traqueia|focinho|respira/i, '🫁'], [/rim|renal|bexiga|pedra/i, '💧'], [/artrose|ligamento|hérnia|coluna|patas|paralisia|neurol|medula/i, '🦴'], [/câncer|caroço|gânglio/i, '🔎'], [/convuls|encefal|cérebro/i, '🧠'], [/olho|cristalino/i, '👁️'], [/pâncreas|diabetes|fígado|cobre/i, '🩺'], [/insola/i, '☀️'], [/anemia/i, '🩸']];
const icone = (n) => (ICONE.find(([re]) => re.test(n)) || [0, '⚠️'])[1];
const curto = (s) => s ? s.replace(/\s*\([^)]*\)/g, '').split(/;|—/)[0].split(',').slice(0, 2).join(',').trim().replace(/\.$/, '') : '';

const out = {};
for (const f of Object.values(F)) {
  const prim = f.nome.toLowerCase().split(' ')[0];
  const r = f.id.startsWith('srd-') ? lista.find(x => x.raca.startsWith('SRD') && x.raca.includes(f.porte === 'medio' ? 'médio' : f.porte))
    : lista.find(x => x.raca.toLowerCase().startsWith(prim)) || lista.find(x => x.raca.toLowerCase().includes('(' + prim)) || lista.find(x => x.raca.toLowerCase().includes(prim));
  if (!r) { console.warn('sem pesquisa:', f.id); continue; }
  out[f.id] = r.doencas.filter(d => !/obesidade/i.test(d.nome)).slice(0, 3).map(d => ({
    nome: d.nome.replace(/ \("sopro"\)/, ' (sopro)'), e: icone(d.nome), dado: DADO[r.raca + '|' + d.nome] || null, sinal: curto(d.sinal_em_casa),
  }));
}
fs.writeFileSync(path.join(__dirname, '..', 'dados', 'tsl-racas.js'), '// GERADO por ferramentas/gerar-tsl.cjs. Não editar à mão.\nwindow.TSL_RACAS = ' + JSON.stringify(out, null, 1) + ';\n');
for (const [k, v] of Object.entries(out)) console.log(k.padEnd(16), v.map(d => `${d.e} ${d.nome} [${d.dado ? 'nº' : '--'}] sinal: ${d.sinal.slice(0, 50)}`).join(' | '));
