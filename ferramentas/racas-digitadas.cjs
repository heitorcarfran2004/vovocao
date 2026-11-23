// Relatório do campo "Outra raça": o que as pessoas digitaram, com o que casou e o que ficou sem casamento.
//   node ferramentas/racas-digitadas.cjs [arquivo.ndjson]
// Use para (1) acrescentar apelidos em dados/racas-todas.js quando algo ficar "sem casamento" ou casar errado
// e (2) ver quais raças fora dos 10 botões aparecem muito (candidatas a virar botão).
const fs = require('fs'), path = require('path');
const arq = process.argv[2] || path.join(__dirname, '..', '_eventos-local.ndjson');
if (!fs.existsSync(arq)) { console.log('sem eventos ainda:', arq); process.exit(0); }
const ev = fs.readFileSync(arq, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

const dig = ev.filter(e => e.ev === 'raca_digitada').map(e => e.dados);
const botoes = ev.filter(e => e.ev === 'resposta' && e.etapa === 'raca').map(e => e.dados.r);
const conta = (arr) => Object.entries(arr.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]);

console.log(`\nRaça escolhida nos botões (${botoes.length}):`);
conta(botoes).forEach(([k, n]) => console.log(String(n).padStart(5), k));

console.log(`\n"Outra raça" digitada (${dig.length}), por raça casada:`);
conta(dig.map(d => d.casou || '(sem casamento)')).forEach(([k, n]) => console.log(String(n).padStart(5), k));

const sem = dig.filter(d => !d.casou);
console.log(`\nSem casamento (${sem.length}) -> acrescentar como apelido em dados/racas-todas.js, ou é lixo:`);
conta(sem.map(d => d.texto.toLowerCase())).forEach(([k, n]) => console.log(String(n).padStart(5), JSON.stringify(k), '| sugestões:', (sem.find(d => d.texto.toLowerCase() === k).sugestoes || []).join(', ')));

const duv = dig.filter(d => d.casou && (d.metodo === 'aproximado' || d.metodo === 'parcial') && d.nota < 0.8);
console.log(`\nCasamentos com nota baixa (${duv.length}) -> conferir se casou certo:`);
duv.forEach(d => console.log('  ', JSON.stringify(d.texto), '->', d.casou, d.metodo, d.nota));
