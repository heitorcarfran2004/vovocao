// Servidor local do quiz do cão idoso.
//   node servidor.cjs   ->  http://localhost:4271
// Variações da abertura: http://localhost:4271/?v=1 ... ?v=5   |   barra do diagnóstico mais curta para testar: &carga=8
// /api/e recebe os eventos (etapa, resposta, raca_digitada, radar...) e grava em _eventos-local.ndjson.
const http = require('http'), fs = require('fs'), path = require('path');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.css': 'text/css', '.mp4': 'video/mp4' };
const PORTA = +process.env.PORTA || 4271;
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/api/e' && req.method === 'POST') {
    let b = ''; req.on('data', c => b += c); req.on('end', () => {
      try { JSON.parse(b); fs.appendFileSync(path.join(__dirname, '_eventos-local.ndjson'), b.trim() + '\n'); } catch (e) {}
      res.writeHead(204); res.end();
    }); return;
  }
  if (p === '/app') { res.writeHead(301, { Location: '/app/' }); return res.end(); }
  if (p.endsWith('/')) p += 'index.html';
  const arq = path.join(__dirname, p);
  if (!arq.startsWith(__dirname) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) { res.writeHead(404); return res.end('nao encontrado: ' + p); }
  const tipo = TIPOS[path.extname(arq)] || 'application/octet-stream', tam = fs.statSync(arq).size;
  if (req.method === 'HEAD') { res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': tam }); return res.end(); }
  const r = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (r) {
    const ini = r[1] ? +r[1] : 0, fim = r[2] ? +r[2] : tam - 1;
    res.writeHead(206, { 'Content-Type': tipo, 'Content-Range': `bytes ${ini}-${fim}/${tam}`, 'Accept-Ranges': 'bytes', 'Content-Length': fim - ini + 1 });
    return fs.createReadStream(arq, { start: ini, end: fim }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': tam, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
  fs.createReadStream(arq).pipe(res);
}).listen(PORTA, () => console.log('http://localhost:' + PORTA));
