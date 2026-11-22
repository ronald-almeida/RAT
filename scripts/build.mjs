import { access } from 'node:fs/promises';
for (const path of ['public/index.html','public/checkout.html','public/obrigado.html','public/guia-de-boas-vindas.pdf','public/assets/background.jpg','public/assets/inscricoes.jpg','public/assets/rat-logo.png']) await access(path);
console.log('RAT: páginas, imagens e guia prontos para publicação.');
