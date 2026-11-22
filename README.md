# RAT — inscrição, Pix e central do aluno

Recriação do formulário de inscrição RAT e do checkout, com as opções Safira e Gold por **R$ 247,00 à vista no Pix**. O acesso é orientado pelo WhatsApp **(75) 98839-3742**, após 48 horas da confirmação do pagamento. O prazo aparece antes da compra, na central e no PDF. Nenhum nome de gateway é exibido ao comprador.

## Rotas

- `/`: apresentação, dados do comprador e escolha do programa.
- `/checkout?plano=safira` ou `?plano=gold`: CPF, consentimento sobre o prazo e Pix em modal.
- `/obrigado`: central do aluno, exibida após verificação do pagamento no servidor.
- `/guia-de-boas-vindas.pdf`: orientações com botões clicáveis de WhatsApp e reembolso.
- `POST /api/checkout`: gera o Pix.
- `GET /api/checkout`: consulta a cobrança com o token do pedido no cabeçalho Authorization.

## Configuração da Vercel

| Variável | Uso |
| --- | --- |
| `ATLAS_SECRET_KEY` | Chave secreta aprovada da Atlas Pags; cadastrar como Sensitive em Production e Preview. |
| `CHECKOUT_SESSION_SECRET` | Segredo aleatório de pelo menos 32 caracteres para assinar as sessões. |
| `SITE_URL` | Origem canônica HTTPS do checkout, sem barra final. |

Depois de adicionar ou alterar uma variável, faça um novo deployment. Sem a chave da Atlas, a página abre, mas a API bloqueia a emissão de cobranças. Não há modo de pagamento fictício na aplicação publicada.

Node.js 22; `npm install`, `npm test`, `npm run build`. A Vercel publica `public/` e as funções em `api/`. Para desenvolvimento, use `npm run dev`.

## Pagamentos e acesso

- Documentação consultada: https://atlaspags.com/docs/ (22/11/2026).
- Valor fixado no servidor: 247 reais, nunca aceito do navegador.
- CPF, nome, e-mail, telefone e programa são validados no servidor.
- Autenticação Bearer da Atlas somente na função da Vercel.
- Repetições de uma tentativa usam a mesma chave de idempotência e o mesmo corpo.
- QR Code gerado localmente a partir do código Pix da API; nenhum serviço de QR externo recebe dados.
- Consulta a cada 12 segundos enquanto o modal está aberto e a página visível; botão de verificação manual.
- Pagamento aprovado exige `status=paid`, valor e metadados corretos, `livemode=true` e nenhum reembolso.
- A sessão assinada dura 90 dias e fica neste navegador. A confirmação nunca é inferida de um clique ou parâmetro na URL.
- Sem banco de dados próprio: a cobrança é mantida no provedor. O acesso ao curso é manual via WhatsApp; não há hospedagem de aulas nem envio automático de credenciais.
- A página informa que o prazo se encerrou após 48 horas; só a equipe confirma a liberação efetiva do curso.
- Reembolso: https://reembolso-de-alunos.vercel.app/ . O botão abre a central; não executa estorno automaticamente.
- Não há webhook porque o estado é consultado diretamente na API antes de mostrar a central. Não há automação de entrega em segundo plano.

## Verificação

`npm test` cobre validação de CPF, valor fixo, idempotência, assinatura e expiração de sessão, estados pendente/expirado/falhou/reembolsado/contestado, rejeição de simulações, prazo de 48 horas e proteção contra respostas inválidas.

Validação financeira real depende de cadastrar `ATLAS_SECRET_KEY` e acompanhar uma cobrança efetivamente paga. Testes automatizados usam respostas locais e não movimentam dinheiro.

## PDF

O arquivo final está em `public/guia-de-boas-vindas.pdf`. Para regenerar, execute `scripts/create-guide.py` com Python, ReportLab e as fontes locais em `public/assets/`.
