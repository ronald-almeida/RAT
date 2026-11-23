import { access, readFile, writeFile } from 'node:fs/promises';
for (const path of ['public/index.html','public/checkout.html','public/obrigado.html','public/termos.html','public/privacidade.html','public/guia-de-boas-vindas.pdf','public/assets/background.jpg','public/assets/inscricoes.jpg','public/assets/rat-logo.png']) await access(path);
const thanks = await readFile('public/obrigado.html', 'utf8');
const preview = thanks
  .replace('<script src="/obrigado.js" defer></script>', '<link rel="stylesheet" href="/previa-obrigado.css">')
  .replace('<title>RAT Academy — Central do aluno</title>', '<title>Prévia — Página de obrigado RAT</title>')
  .replace('<body class="members-page">', '<body class="members-page"><aside class="preview-notice">PRÉVIA VISUAL · Exemplo de como a página aparece após o pagamento. Nenhuma compra foi realizada.</aside>')
  .replace(/<section id="checking"[\s\S]*?<\/section>/, '')
  .replace(/<section id="not-paid"[\s\S]*?<\/section>/, '')
  .replace('id="member-content" hidden', 'id="member-content"')
  .replace('<h2 id="member-product">RAT Black</h2>', '<h2 id="member-product">T8 RAT BLACK SAFIRA</h2>')
  .replace('<span id="receipt-id"></span>', '<span id="receipt-id">Pedido de demonstração</span>')
  .replace(/<noscript>[\s\S]*?<\/noscript>/, '');
await writeFile('public/previa-obrigado.html', preview);
await writeFile('public/previa-obrigado.css', '.preview-notice{background:#fff1c4;color:#694e0b;padding:13px 20px;text-align:center;font-size:14px;line-height:1.6;border-bottom:1px solid #ead28c}');
console.log('RAT: páginas, imagens e guia prontos para publicação.');
