const $=id=>document.getElementById(id);
const plans={safira:'T8 RAT BLACK SAFIRA',gold:'T8 RAT BLACK GOLD'};
const get=(storage,key)=>{try{return JSON.parse(storage.getItem(key)||'null');}catch{return null;}};
const save=(storage,key,value)=>{try{storage.setItem(key,JSON.stringify(value));}catch{}};
let details=get(sessionStorage,'rat-inscription')||{};
let plan=new URLSearchParams(location.search).get('plano')||details.plan||'safira';
if(!plans[plan])plan='safira';
$('product-title').textContent=plans[plan];
$('product-image').src=plan==='gold'?'/assets/gold.jpg':'/assets/safira.jpg';
$('product-image').alt=plans[plan];
for(const key of ['name','email','phone'])$(key).value=details[key]||'';
try{sessionStorage.removeItem('rat-inscription');}catch{}
let payment=get(localStorage,'rat-payment');
let orderKey=crypto.randomUUID(),lockedBody=null,inFlight=false,pollTimer=null,tickTimer=null,checking=false;
const dialog=$('pix-dialog');
if(payment?.token){$('existing-order').hidden=false;}
function error(message){$('checkout-error').textContent=message;$('checkout-error').hidden=!message;}
function clearTimers(){clearTimeout(pollTimer);clearInterval(tickTimer);}
function persistPayment(value){payment=value;save(localStorage,'rat-payment',value);}
async function api(method,body,token){
  const response=await fetch('/api/checkout',{method,headers:{...(method==='POST'?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'});
  const data=await response.json();if(!response.ok)throw Error(data.error||'Não foi possível consultar seu pagamento.');return data;
}
function tick(){
  const diff=Date.parse(payment?.expiresAt)-Date.now();
  if(!Number.isFinite(diff))return;
  if(diff<=0){$('expiration').textContent='O prazo deste QR Code terminou. Verifique o pagamento antes de gerar outro.';$('copy-pix').disabled=true;$('copy-qr').disabled=true;$('new-pix').hidden=false;return;}
  const secs=Math.ceil(diff/1000);$('expiration').textContent='Código válido por '+String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');
}
function openPayment(){
  if(!payment?.code){location.href='/obrigado';return;}
  clearTimers();$('qr-image').src=payment.qr;$('pix-code').value=payment.code;
  $('payment-status').textContent='Aguardando confirmação do Pix';$('copy-feedback').textContent='';$('new-pix').hidden=true;
  $('copy-pix').disabled=false;$('copy-qr').disabled=false;
  if(!dialog.open)dialog.showModal();tick();tickTimer=setInterval(tick,1000);checkPayment(false);
}
async function checkPayment(manual=false){
  if(checking||!payment?.token)return;checking=true;$('check-payment').disabled=true;clearTimeout(pollTimer);
  try{
    const status=await api('GET',null,payment.token);
    if(status.paid){clearTimers();$('payment-status').textContent='Pagamento confirmado! Abrindo sua central…';location.href='/obrigado';return;}
    if(['refunded','chargeback'].includes(status.status)){clearTimers();location.href='/obrigado';return;}
    if(['expired','failed'].includes(status.status)){
      $('payment-status').textContent=status.status==='expired'?'Este Pix expirou. Se você já pagou, fale com o atendimento.':'Este Pix não foi concluído. Você pode tentar novamente.';
      $('new-pix').hidden=false;$('copy-pix').disabled=true;$('copy-qr').disabled=true;clearTimers();return;
    }
    $('payment-status').textContent=manual?'Seu pagamento ainda não foi confirmado. Vamos continuar verificando.':'Aguardando confirmação do Pix';
  }catch(e){$('payment-status').textContent=e.message;}
  finally{checking=false;$('check-payment').disabled=false;if(dialog.open&&!document.hidden&&$('new-pix').hidden)pollTimer=setTimeout(()=>checkPayment(false),12000);}
}
$('checkout-form').onsubmit=async event=>{
  event.preventDefault();if(inFlight)return;
  if(payment?.token){openPayment();return;}
  if(!lockedBody){lockedBody={name:$('name').value,email:$('email').value,phone:$('phone').value,document:$('document').value,plan,orderKey,termsAccepted:$('terms-accepted').checked};}
  inFlight=true;error('');$('generate').disabled=true;$('generate').textContent='Gerando seu Pix…';
  try{const data=await api('POST',lockedBody);persistPayment(data);$('existing-order').hidden=false;openPayment();}
  catch(e){error(e.message);}
  finally{inFlight=false;$('generate').disabled=false;$('generate').textContent=payment?'Acompanhar meu Pix':'Gerar Pix de R$ 247,00';}
};
// Keep the exact same payload and request key after network errors. Editing starts a new order.
$('checkout-form').addEventListener('input',()=>{if(!inFlight){lockedBody=null;orderKey=crypto.randomUUID();}});
$('document').addEventListener('input',event=>{let v=event.target.value.replace(/\D/g,'').slice(0,11);event.target.value=v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');});
async function copyPix(){
  if(!payment?.code)return;
  try{await navigator.clipboard.writeText(payment.code);$('copy-feedback').textContent='Código Pix copiado! Cole no app do seu banco.';}
  catch{const field=$('pix-code');field.focus();field.select();let copied=false;try{copied=document.execCommand('copy');}catch{}$('copy-feedback').textContent=copied?'Código Pix copiado!':'Selecione o código acima e copie manualmente.';}
}
$('copy-pix').onclick=copyPix;$('copy-qr').onclick=copyPix;
$('check-payment').onclick=()=>checkPayment(true);
$('close-dialog').onclick=()=>dialog.close();dialog.addEventListener('close',clearTimers);
$('resume').onclick=openPayment;
function resetOrder(){clearTimers();if(dialog.open)dialog.close();payment=null;try{localStorage.removeItem('rat-payment');}catch{}lockedBody=null;orderKey=crypto.randomUUID();$('existing-order').hidden=true;$('generate').textContent='Gerar Pix de R$ 247,00';error('');}
$('another-order').onclick=()=>{if(confirm('Você quer iniciar outra inscrição? Se já pagou, acompanhe o pedido atual para evitar um novo pagamento.'))resetOrder();};
$('new-pix').onclick=async()=>{
  if(checking)return;$('new-pix').disabled=true;
  try{const status=await api('GET',null,payment.token);if(status.paid){location.href='/obrigado';return;}if(!['expired','failed'].includes(status.status)){$('payment-status').textContent='O pedido ainda está pendente. Aguarde a confirmação ou fale com o atendimento.';return;}resetOrder();}
  catch(e){$('payment-status').textContent=e.message;}finally{$('new-pix').disabled=false;}
};
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(pollTimer);}else if(dialog.open){checkPayment(false);}});
window.addEventListener('pagehide',clearTimers);
