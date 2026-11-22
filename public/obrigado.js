const $=id=>document.getElementById(id);
let timer;
function pending(message,title='Vamos conferir sua compra'){$('checking').hidden=true;$('member-content').hidden=true;$('not-paid').hidden=false;$('pending-title').textContent=title;$('pending-message').textContent=message;}
async function load(){
  let payment;try{payment=JSON.parse(localStorage.getItem('rat-payment')||'null');}catch{}
  if(!payment?.token){pending('Não encontramos um pedido neste navegador. Se já pagou, fale com o atendimento e envie seu comprovante.');return;}
  try{
    const response=await fetch('/api/checkout',{headers:{Authorization:'Bearer '+payment.token},cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error);
    if(!data.paid){
      const messages={refunded:'Este pagamento foi reembolsado. Fale com nossa equipe se precisar de ajuda.',chargeback:'Este pagamento está em contestação. Entre em contato com o atendimento.',expired:'O prazo do Pix terminou. Se você já pagou, fale com o atendimento.',failed:'O pagamento não foi concluído. Volte ao checkout para tentar novamente.'};
      pending(messages[data.status]||'Seu pagamento ainda está aguardando confirmação. Assim que o pagamento for confirmado, suas orientações aparecerão aqui.','Status do seu pedido');
      if(data.status==='pending'&&!document.hidden)timer=setTimeout(load,15000);return;
    }
    $('checking').hidden=true;$('not-paid').hidden=true;$('member-content').hidden=false;
    $('member-product').textContent=data.product;$('receipt-id').textContent='Pedido: '+data.id;$('access-whatsapp').href=data.whatsappUrl;
    if(data.releaseAt){const date=new Date(data.releaseAt);$('release-date').textContent='Liberação a partir de '+new Intl.DateTimeFormat('pt-BR',{dateStyle:'long',timeStyle:'short',timeZone:'America/Bahia'}).format(date)+' (horário de Brasília).';
      if(Date.now()>=date.getTime()){$('access-status').textContent='Prazo de espera concluído';$('release-description').textContent='As 48 horas desde a confirmação do pagamento já passaram. Fale com a equipe para receber seu acesso ao sistema.';}
    }
  }catch(e){pending(e.message||'Não foi possível consultar seu pagamento agora. Atualize a página ou fale com o atendimento.');}
}
load();document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(!document.hidden)load();});window.addEventListener('pagehide',()=>clearTimeout(timer));
