from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader

root=Path(__file__).resolve().parents[1]
assets=root/'public/assets'
for weight in [400,600,700]:pdfmetrics.registerFont(TTFont('Exo'+str(weight),str(assets/f'exo2-{weight}.ttf')))
out=root/'public/guia-de-boas-vindas.pdf'
c=canvas.Canvas(str(out),pagesize=(595.28,841.89))
c.setTitle('RAT Academy - Guia de boas-vindas')
c.setAuthor('RAT Academy')
navy=HexColor('#072e56');yellow=HexColor('#ffc01c');muted=HexColor('#60768b')
c.setFillColor(HexColor('#f4f7fb'));c.rect(0,0,595.28,841.89,fill=1,stroke=0)
c.setFillColor(navy);c.rect(0,598,595.28,244,fill=1,stroke=0)
c.drawImage(ImageReader(str(assets/'rat-logo.png')),45,771,width=65,height=30,preserveAspectRatio=True,mask='auto')
c.setFillColor(HexColor('#a8c5df'));c.setFont('Exo600',10);c.drawString(45,746,'CENTRAL DO ALUNO / GUIA DE BOAS-VINDAS')
c.setFillColor(white);c.setFont('Exo600',33);c.drawString(45,693,'Sua jornada começa aqui.')
c.setFont('Exo400',13);c.drawString(45,662,'Obrigado por escolher a RAT Academy.')
c.setFillColor(yellow);c.roundRect(45,616,230,27,6,fill=1,stroke=0)
c.setFillColor(navy);c.setFont('Exo600',11);c.drawString(57,625,'R$ 247,00 · pagamento único via Pix')

def para(text,x,y,width=505,size=12,color=muted,font='Exo400',leading=19):
 p=Paragraph(text,ParagraphStyle('p',fontName=font,fontSize=size,leading=leading,textColor=color));_,h=p.wrap(width,200);p.drawOn(c,x,y-h);return y-h

c.setFillColor(white);c.roundRect(35,394,525,176,12,fill=1,stroke=0)
c.setFillColor(navy);c.setFont('Exo600',19);c.drawString(53,535,'Quando meu acesso será liberado?')
para('Por conta desta condição especial, o acesso ao produto será liberado <b>após dois dias (48 horas) da confirmação do pagamento</b>. O prazo começa quando o Pix é confirmado, e não quando o código é gerado.',53,516,width=486,size=12)
para('A data de referência aparece na sua central após a confirmação. Guarde o comprovante e o número do pedido para facilitar o atendimento.',53,444,width=486,size=11,leading=17)

c.setFillColor(navy);c.setFont('Exo600',20);c.drawString(45,357,'Seu próximo passo')
para('Clique no botão abaixo para falar com a equipe pelo WhatsApp. Informe o programa escolhido e o número do pedido para receber as orientações de acesso ao sistema.',45,338,size=12)
c.setFillColor(yellow);c.roundRect(45,227,505,43,7,fill=1,stroke=0)
c.setFillColor(navy);c.setFont('Exo600',13);c.drawCentredString(297.5,243,'SOLICITAR ACESSO PELO WHATSAPP')
c.linkURL('https://wa.me/5575988393742?text=Ol%C3%A1%21%20Quero%20as%20orienta%C3%A7%C3%B5es%20de%20acesso%20ao%20RAT.',(45,227,550,270),relative=0)

c.setFillColor(navy);c.setFont('Exo600',17);c.drawString(45,190,'Se precisar de reembolso')
para('A central de reembolso está disponível também durante o prazo de espera. Tenha em mãos os dados da compra e o comprovante do Pix.',45,173,size=11,leading=17)
c.setStrokeColor(HexColor('#cbd6e2'));c.setFillColor(white);c.roundRect(45,88,505,37,6,fill=1,stroke=1)
c.setFillColor(navy);c.setFont('Exo600',12);c.drawCentredString(297.5,101,'SOLICITAR REEMBOLSO')
c.linkURL('https://reembolso-de-alunos.vercel.app/',(45,88,550,125),relative=0)
c.setFillColor(muted);c.setFont('Exo400',9);c.drawString(45,48,'Atendimento: (75) 98839-3742')
c.drawRightString(550,48,'RAT Academy · Guia introdutório · 1 / 1')
c.save()
print(out)
