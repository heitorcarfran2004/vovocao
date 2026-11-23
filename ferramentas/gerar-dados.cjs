// Gera dados/racas-quiz.js a partir de pesquisa/cao-idoso/racas/racas.json
//   node ferramentas/gerar-dados.cjs
// Se o veterinário corrigir o racas.json, é só rodar de novo.
const fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..');
const fonte = path.join(RAIZ, '..', '..', 'pesquisa', 'cao-idoso', 'racas', 'racas.json');
const racas = JSON.parse(fs.readFileSync(fonte, 'utf8'));

// id curto por raça (ordem/prefixo do racas.json)
const IDS = [
  [/^SRD.*pequeno/i, 'srd-pequeno'], [/^SRD.*médio/i, 'srd-medio'], [/^SRD.*grande/i, 'srd-grande'],
  [/^Shih/i, 'shih-tzu'], [/^Yorkshire/i, 'yorkshire'], [/^Spitz/i, 'lulu'], [/^Lhasa/i, 'lhasa'],
  [/^Pinscher/i, 'pinscher'], [/^Maltês/i, 'maltes'], [/^Poodle/i, 'poodle'], [/^Dachshund/i, 'dachshund'],
  [/^Chihuahua/i, 'chihuahua'], [/^Cavalier/i, 'cavalier'], [/^Jack/i, 'jack-russell'], [/^Schnauzer/i, 'schnauzer'],
  [/^Pug/i, 'pug'], [/^Bulldog Francês/i, 'bulldog-frances'], [/^Bulldog Inglês/i, 'bulldog-ingles'], [/^Beagle/i, 'beagle'],
  [/^Cocker/i, 'cocker'], [/^Border/i, 'border-collie'], [/^Pit/i, 'pitbull'], [/^Golden/i, 'golden'],
  [/^Labrador/i, 'labrador'], [/^Pastor/i, 'pastor-alemao'], [/^Rottweiler/i, 'rottweiler'], [/^Boxer/i, 'boxer'],
  [/^Husky/i, 'husky'], [/^Dálmata/i, 'dalmata'],
];
// nome curto para a tela
const CURTO = { 'srd-pequeno': 'vira-lata', 'srd-medio': 'vira-lata', 'srd-grande': 'vira-lata', 'lulu': 'Lulu da Pomerânia',
  'dachshund': 'Salsicha (Dachshund)', 'pinscher': 'Pinscher', 'poodle': 'Poodle', 'yorkshire': 'Yorkshire', 'schnauzer': 'Schnauzer',
  'cocker': 'Cocker', 'pitbull': 'Pit Bull', 'golden': 'Golden', 'labrador': 'Labrador', 'cavalier': 'Cavalier', 'jack-russell': 'Jack Russell' };

// cada doença aponta para um dos 7 sinais do radar (ou "outro", que não vira pergunta)
// chave = assunto da pergunta, para não repetir a pergunta genérica do mesmo assunto
function sinalDe(nome) {
  const n = nome.toLowerCase();
  if (/gengiva/.test(n)) return ['boca', 'boca'];
  if (/vasos sangu|anemia/.test(n)) return ['caroco', 'gengiva'];
  if (/câncer|gânglios|tumor/.test(n)) return ['caroco', 'caroco'];
  if (/válvula|coração|focinho|traqueia|laringe|arritmia|insola/.test(n)) return ['respiracao', 'respiracao'];
  if (/renal|diabetes|cortisol|bexiga|tireoide/.test(n)) return ['agua', 'agua'];
  if (/hérnia|neurológica|medula|patas de trás/.test(n)) return ['patas', 'coluna'];
  if (/artrose|ligamento|osso/.test(n)) return ['patas', 'patas'];
  if (/vasos sangu|anemia/.test(n)) return ['caroco', 'gengiva'];
  if (/câncer|gânglios|tumor/.test(n)) return ['caroco', 'caroco'];
  if (/demência|convuls|cérebro|fígado \(desvio|desvio de sangue/.test(n)) return ['noite', 'noite'];
  if (/pâncreas|torção/.test(n)) return ['apetite', 'apetite'];
  return ['outro', 'outro'];
}
// assuntos que já têm pergunta genérica no Ato 2 (não repetir na raça)
const JA_NO_ATO2 = new Set(['agua', 'patas']);
const EVITAR = /obesidade|carrapato|acidente|sol/i; // peso não é a promessa; o resto foge do idoso

// O quiz vende longevidade e qualidade de vida, não emagrecimento: troca os ganchos que falam de peso.
const GANCHO_QUIZ = {
  'srd-medio': 'Metade dos cães com mais de 10 anos vai ter câncer em algum momento, segundo a Associação Veterinária Americana. E artrose e rim estão logo atrás entre os problemas do cão médio idoso.',
  'srd-grande': 'Quando veterinários procuraram com um checklist, mais de 1 em cada 3 cães tinha sinais de artrose, e a maioria nunca tinha sido diagnosticada. Em cão grande, o primeiro sinal costuma ser demorar para levantar.',
  'labrador': 'Artrose, câncer e rompimento do ligamento do joelho são os problemas que mais pesam no Labrador idoso. O primeiro sinal costuma ser demorar para levantar ou hesitar antes de subir no carro.',
};

const out = {};
for (const r of racas) {
  const par = IDS.find(([re]) => re.test(r.raca));
  if (!par) { console.warn('sem id:', r.raca); continue; }
  const id = par[1];
  const doencas = r.doencas.map(d => {
    const [sinal, chave] = sinalDe(d.nome);
    return { nome: d.nome, sinal, chave, pergunta: d.pergunta_quiz || '' };
  });
  const perguntas = [];
  for (const d of doencas) {
    if (perguntas.length >= 2) break;
    if (d.sinal === 'outro' || EVITAR.test(d.nome) || !d.pergunta || JA_NO_ATO2.has(d.chave)) continue;
    if (perguntas.some(p => p.chave === d.chave || p.texto === d.pergunta)) continue;
    perguntas.push({ texto: d.pergunta, sinal: d.sinal, chave: d.chave, doenca: d.nome });
  }
  out[id] = {
    id, nome: r.raca.replace(/\s*\(.*\)$/, '').replace(/^SRD \(vira-lata\) — /, 'Vira-lata '),
    curto: CURTO[id] || r.raca.replace(/\s*\(.*\)$/, ''),
    porte: r.porte, vive: r.expectativa_anos, idosoAos: r.senior_a_partir,
    gancho: GANCHO_QUIZ[id] || (r.gancho || '').replace(/\s*\(ver nota\)\.?/i, '').trim(),
    doencas: doencas.filter(d => d.sinal !== 'outro' && !EVITAR.test(d.nome)).slice(0, 3).map(d => d.nome),
    riscos: [...new Set(doencas.slice(0, 3).map(d => d.sinal).filter(s => s !== 'outro'))],
    perguntas,
  };
}
const destino = path.join(RAIZ, 'dados', 'racas-quiz.js');
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, '// GERADO por ferramentas/gerar-dados.cjs a partir de racas.json. Não editar à mão.\nwindow.FICHAS = ' + JSON.stringify(out, null, 1) + ';\n');
// o app é outro repositório (vovocao-app): leva uma cópia das fichas
fs.copyFileSync(destino, path.join(RAIZ, 'app', 'dados', 'racas-quiz.js'));
console.log('ok:', Object.keys(out).length, 'fichas ->', destino, '+ app/dados/racas-quiz.js');
for (const f of Object.values(out)) console.log(f.id.padEnd(16), f.perguntas.length, 'perg |', f.riscos.join(','), '|', f.doencas.join('; '));
