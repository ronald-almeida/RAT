import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import handler from '../api/checkout.js';
const portArg=process.argv.indexOf('--port');
const port = Number(process.env.PORT || (portArg>=0?process.argv[portArg+1]:3000));
process.env.SITE_URL ||= 'http://localhost:' + port;
const types = { '.html': 'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.ttf':'font/ttf', '.pdf':'application/pdf' };
http.createServer(async (req,res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/checkout') {
    if(req.headers.origin) process.env.SITE_URL=req.headers.origin;
    const chunks=[];let size=0;
    for await (const chunk of req) { size+=chunk.length;if(size>12000){res.writeHead(413).end();return;}chunks.push(chunk); }
    req.body=Buffer.concat(chunks).toString();
    res.status = n => { res.statusCode=n;return res; };res.json = value => {res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
    return handler(req,res);
  }
  const route = {'/':'/index.html','/checkout':'/checkout.html','/obrigado':'/obrigado.html'}[url.pathname] || url.pathname;
  const file=path.resolve('public','.'+route);
  if(!file.startsWith(path.resolve('public')+path.sep)){res.writeHead(403).end();return;}
  try {const content=await readFile(file);res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(content);} catch {res.writeHead(404).end('Página não encontrada');}
}).listen(port,'0.0.0.0',()=>console.log('RAT disponível na porta '+port));
