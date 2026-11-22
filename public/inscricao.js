const $ = id => document.getElementById(id);
let step = 0;
const sections = ['welcome','details','programs'];
function show(index) {
  step=index;sections.forEach((id,n)=>$(id).hidden=n!==index);
  document.querySelector('.stage-navigation').hidden=index===0;
  $('progress').style.width=(index/3*100)+'%';
  document.querySelector('[role=progressbar]').setAttribute('aria-valuenow',index);
  $('next').disabled=index===2;
  if(index) $(sections[index]).querySelector('h1').focus();
  window.scrollTo(0,0);
}
$('start').onclick=()=>show(1);
$('back').onclick=()=>show(Math.max(0,step-1));
$('next').onclick=()=>{if(step===1)$('details-form').requestSubmit();};
$('details-form').onsubmit=event=>{
  event.preventDefault();const phone=$('phone').value.replace(/\D/g,'');
  if(!$('name').value.trim().includes(' ') || !/^(55)?\d{10,11}$/.test(phone)) { $('details-error').textContent='Informe seu nome completo e um WhatsApp válido com DDD.';$('details-error').hidden=false;return; }
  $('details-error').hidden=true;show(2);
};
$('program-form').onsubmit=event=>{
  event.preventDefault();const plan=new FormData(event.target).get('plan');
  try { sessionStorage.setItem('rat-inscription',JSON.stringify({name:$('name').value.trim(),email:$('email').value.trim(),phone:$('phone').value,plan})); } catch {}
  location.href='/checkout?plano='+plan;
};
