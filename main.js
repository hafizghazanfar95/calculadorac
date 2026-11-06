// Numeria / calculadorac.com — shared calculators. Plain JS, no server.
// Pure functions are exported for Node testing (module.exports guard at end).
'use strict';
const UMA_D=117.31, SMG_D=315.04, SBC_CAP=2932.75;
const ISR=[ [0.01,844.59,0,0.0192],[844.60,7168.51,16.22,0.064],[7168.52,12598.02,420.95,0.1088],[12598.03,14644.64,1011.68,0.16],[14644.65,17533.64,1339.14,0.1792],[17533.65,35362.83,1856.84,0.2136],[35362.84,55736.68,5665.16,0.2352],[55736.69,106410.50,10457.09,0.30],[106410.51,141880.66,25659.23,0.32],[141880.67,425641.99,37009.69,0.34],[425642.00,Infinity,133488.54,0.35] ];
function r2(n){return Math.round((n+Number.EPSILON)*100)/100;}
function isrMensual(base){ if(base<=0) return 0; for(const [lo,hi,f,t] of ISR){ if(base>=lo && base<=hi) return Math.max(0, r2(f+(base-lo)*t)); } return 0; }
function imssObrero(sbcDiario, dias){
  dias=dias||30.4; const sbc=Math.min(sbcDiario,SBC_CAP), base=sbc*dias;
  const emDinero=base*0.0025, emPens=base*0.00375, invalidez=base*0.00625, cesantia=base*0.01125;
  const excedente=Math.max(0,sbc-3*UMA_D)*dias*0.004;
  return {base:r2(base), emDinero:r2(emDinero), emPens:r2(emPens), invalidez:r2(invalidez), cesantia:r2(cesantia), excedente:r2(excedente), total:r2(emDinero+emPens+invalidez+cesantia+excedente)};
}
// Sueldo neto MX — modelo verificado: SBC diario=(bruto/30)*1.0493 (año 1, editable),
// IMSS con base mensual de 30.4 días; ISR sobre el bruto mensual, menos subsidio si aplica.
// Reproduce $10,000→$9,554.10 y $15,000→$13,197.38 al centavo; $20,000 da $17,069.02
// (la cifra $17,076.78 del archivo de tasas difiere $7.76 con ese mismo modelo — ver BUILD-REPORT).
function sueldoNetoMX(bruto, factor){
  factor=factor||1.0493; if(bruto<=0) return {bruto:0,sbcDiario:0,imss:imssObrero(0),isrBruto:0,subsidio:0,isrPagar:0,neto:0};
  const sbcDiario=r2((bruto/30)*factor);
  const imss=imssObrero(sbcDiario,30.4);
  const isrBruto=isrMensual(bruto);
  const subsidio = bruto<=11492.66 ? 535.65 : 0;
  const isrPagar=Math.max(0, r2(isrBruto-subsidio));
  return {bruto:r2(bruto), sbcDiario, imss, isrBruto, subsidio, isrPagar, neto:r2(bruto-isrPagar-imss.total)};
}
function aguinaldoMX(salarioDiario, diasTrabajados){
  const dias=diasTrabajados==null?365:diasTrabajados;
  const bruto=r2(salarioDiario*15*dias/365);
  const exento=30*UMA_D, gravable=Math.max(0,r2(bruto-exento));
  return {bruto, exento:r2(exento), gravable, dias};
}
function primaVacacional(salarioDiario, diasVac){
  const bruto=r2(salarioDiario*diasVac*0.25);
  const exento=15*UMA_D, gravable=Math.max(0,r2(bruto-exento));
  return {bruto, exento:r2(exento), gravable};
}
function vacacionesDias(anios){
  if(anios<1) return 0; if(anios<2) return 12; if(anios<3) return 14; if(anios<4) return 16; if(anios<5) return 18; if(anios<6) return 20;
  if(anios<=10) return 22; if(anios<=15) return 24; if(anios<=20) return 26; if(anios<=25) return 28; if(anios<=30) return 30; if(anios<=35) return 32; return 34;
}
function finiquitoMX(o){
  // o: salarioDiario, diasSalarioPend, diasAguinaldoProp, diasVacPend
  const salario=r2(o.salarioDiario*o.diasSalarioPend||0);
  const ag=o.salarioDiario*(o.diasAguinaldoProp||0)/365*15;
  const vac=r2(o.salarioDiario*(o.diasVacPend||0));
  const prima=r2(vac*0.25);
  return {salario:r2(salario), aguinaldo:r2(ag), vacaciones:vac, prima, total:r2(salario+ag+vac+prima)};
}
function liquidacionMX(o){
  // o: sdi, salarioDiario, anios, + finiquito inputs
  const fin=finiquitoMX(o);
  const ind90=r2(90*o.sdi), ind20=r2(20*o.anios*o.sdi);
  const basePrima=Math.min(o.salarioDiario, 2*SMG_D);
  const primaAnt=r2(12*o.anios*basePrima);
  return Object.assign(fin, {ind90, ind20, primaAnt, total:r2(fin.total+ind90+ind20+primaAnt)});
}
function ivaCalc(monto, tasa, modo){ // modo 'sumar'|'quitar'
  if(modo==='quitar'){ const neto=r2(monto/(1+tasa)); return {neto, iva:r2(monto-neto), total:r2(monto)}; }
  const iva=r2(monto*tasa); return {neto:r2(monto), iva, total:r2(monto+iva)};
}
function hipoteca(principal, tasaAnual, anios){
  const i=tasaAnual/100/12, n=anios*12;
  const mensual = i===0 ? principal/n : r2(principal*i*Math.pow(1+i,n)/(Math.pow(1+i,n)-1));
  return {mensual, total:r2(mensual*n), intereses:r2(mensual*n-principal), n};
}
function sueldoNetoAR(bruto){
  const base=Math.min(bruto, 4769631.49);
  const aportes=r2(base*0.17);
  return {bruto:r2(bruto), base:r2(base), aportes, neto:r2(bruto-aportes)};
}
function aguinaldoAR(mejorSueldo, meses){
  const bruto=r2(mejorSueldo/2*(meses/6));
  return {bruto, netoEst:r2(bruto*0.83), aportes:r2(bruto*0.17)};
}
// ---- DOM helpers (browser only) ----
function fmt(n, cur){ try{ return (cur==='ARS'?'$ ':'$ ')+Number(n).toLocaleString('es-MX',{minimumFractionDigits:2, maximumFractionDigits:2}); }catch(e){ return '$ '+n; } }
function val(id){ const el=document.getElementById(id); if(!el) return 0; const v=parseFloat(String(el.value).replace(/,/g,'')); return isNaN(v)?0:v; }
function setHTML(id, html){ const el=document.getElementById(id); if(el) el.innerHTML=html; }
function rows(pairs){ return '<table>'+pairs.map(p=>'<tr><td>'+p[0]+'</td><td>'+p[1]+'</td></tr>').join('')+'</table>'; }
function errIf(el, bad){ if(!el) return false; if(bad){ el.innerHTML='<div class="warn">Revisa los datos: usa números mayores que 0.</div>'; return true; } return false; }
if (typeof document!=='undefined'){
document.addEventListener('DOMContentLoaded', ()=>{
  const bind=(formId, fn)=>{ const f=document.getElementById(formId); if(f) f.addEventListener('submit', e=>{ e.preventDefault(); fn(); }); };
  // Aguinaldo MX
  bind('f-aguinaldo-mx', ()=>{ const sd=val('ag-sd'), d=val('ag-dias'); if(errIf(document.getElementById('r-aguinaldo-mx'), sd<=0||d<0||d>365)) return;
    const r=aguinaldoMX(sd,d); setHTML('r-aguinaldo-mx','<div class="big">'+fmt(r.bruto)+'</div><p class="muted">Aguinaldo bruto estimado</p>'+rows([['Salario diario',fmt(sd)],['Días trabajados en el año',d+' de 365'],['Fórmula','Salario diario × 15 × días ÷ 365'],['Exento de ISR (30 UMA)',fmt(r.exento)],['Parte gravable (si aplica)',fmt(r.gravable)]])+'<p class="small">La parte exenta no paga ISR; solo el excedente, si lo hay, se grava. Págalo antes del 20 de diciembre (Art. 87 LFT).</p>'); });
  // Finiquito
  bind('f-finiquito', ()=>{ const o={salarioDiario:val('fi-sd'),diasSalarioPend:val('fi-sal'),diasAguinaldoProp:val('fi-ag'),diasVacPend:val('fi-vac')}; if(errIf(document.getElementById('r-finiquito'), o.salarioDiario<=0)) return;
    const r=finiquitoMX(o); setHTML('r-finiquito','<div class="big">'+fmt(r.total)+'</div><p class="muted">Finiquito total estimado</p>'+rows([['Salario pendiente',fmt(r.salario)],['Aguinaldo proporcional',fmt(r.aguinaldo)],['Vacaciones proporcionales',fmt(r.vacaciones)],['Prima vacacional (25%)',fmt(r.prima)]])); });
  // Liquidación
  bind('f-liquidacion', ()=>{ const o={sdi:val('li-sdi'),salarioDiario:val('li-sd'),anios:val('li-anios'),diasSalarioPend:val('li-sal'),diasAguinaldoProp:val('li-ag'),diasVacPend:val('li-vac')}; if(errIf(document.getElementById('r-liquidacion'), o.sdi<=0||o.anios<0)) return;
    const r=liquidacionMX(o); setHTML('r-liquidacion','<div class="big">'+fmt(r.total)+'</div><p class="muted">Liquidación total estimada (finiquito + indemnización)</p>'+rows([['Finiquito (salario + aguinaldo + vacaciones + prima)',fmt(r.salario+r.aguinaldo+r.vacaciones+r.prima)],['Indemnización: 90 días × SDI',fmt(r.ind90)],['Indemnización: 20 días por año × SDI',fmt(r.ind20)],['Prima de antigüedad: 12 días por año (tope 2 × SMG)',fmt(r.primaAnt)]])+'<p class="small">Prima de antigüedad topada a $630.08 por día (2 × SMG general $315.04). En Frontera Norte el tope es $881.74.</p>'); });
  // Sueldo neto MX
  bind('f-sueldo-mx', ()=>{ const b=val('sn-bruto'), f=val('sn-factor')||1.0493; if(errIf(document.getElementById('r-sueldo-mx'), b<=0)) return;
    const r=sueldoNetoMX(b,f); setHTML('r-sueldo-mx','<div class="big">'+fmt(r.neto)+'</div><p class="muted">Sueldo neto mensual estimado</p>'+rows([['Sueldo bruto',fmt(r.bruto)],['SBC diario ('+fmt(r.sbcDiario)+' × 30.4 días)',fmt(r.imss.base)],['Cuota IMSS obrero',fmt(r.imss.total)],['ISR antes de subsidio',fmt(r.isrBruto)],['Subsidio al empleo',fmt(r.subsidio)],['ISR a pagar',fmt(r.isrPagar)]])+'<p class="small">Base mensual del IMSS: 30.4 días. ISR calculado sobre el bruto mensual; el subsidio aplica solo si el ingreso gravable es ≤ $11,492.66.</p>'); });
  // IVA MX
  bind('f-iva-mx', ()=>{ const m=val('iva-monto'), t=val('iva-tasa')/100, modo=document.getElementById('iva-modo').value; if(errIf(document.getElementById('r-iva-mx'), m<=0)) return;
    const r=ivaCalc(m,t,modo); setHTML('r-iva-mx','<div class="big">'+fmt(r.total)+'</div><p class="muted">'+(modo==='quitar'?'Precio con IVA (ya lo incluía)':'Precio final con IVA')+'</p>'+rows([['Monto sin IVA',fmt(r.neto)],['IVA ('+(t*100)+'%)',fmt(r.iva)],['Total',fmt(r.total)]])); });
  // Prima vacacional
  bind('f-prima', ()=>{ const sd=val('pv-sd'), an=val('pv-anios'); if(errIf(document.getElementById('r-prima'), sd<=0||an<0)) return;
    const dias=vacacionesDias(an); const r=primaVacacional(sd,dias); setHTML('r-prima','<div class="big">'+fmt(r.bruto)+'</div><p class="muted">Prima vacacional estimada (25%)</p>'+rows([['Días de vacaciones (Art. 76 LFT)',dias+' días'],['Salario diario',fmt(sd)],['Vacaciones en dinero (referencia)',fmt(sd*dias)],['Exenta de ISR (15 UMA)',fmt(r.exento)],['Parte gravable (si aplica)',fmt(r.gravable)]])); });
  // IMSS
  bind('f-imss', ()=>{ const sbc=val('im-sbc'); if(errIf(document.getElementById('r-imss'), sbc<=0)) return;
    const r=imssObrero(sbc,30.4); setHTML('r-imss','<div class="big">'+fmt(r.total)+'</div><p class="muted">Cuota IMSS del trabajador, mensual (30.4 días)</p>'+rows([['SBC mensual',fmt(r.base)],['Enfermedad y maternidad, prestaciones en dinero (0.25%)',fmt(r.emDinero)],['Enfermedad y maternidad, pensionados (0.375%)',fmt(r.emPens)],['Invalidez y vida (0.625%)',fmt(r.invalidez)],['Cesantía en edad avanzada y vejez (1.125%)',fmt(r.cesantia)],['Excedente sobre 3 UMA (0.40%)',fmt(r.excedente)]])+'<p class="small">Tope del SBC: 25 UMA = $2,932.75 por día. Si tu SBC es mayor, se calcula sobre el tope.</p>'); });
  // Infonavit / hipoteca
  bind('f-info', ()=>{ const p=val('in-monto'), t=val('in-tasa'), a=val('in-anios'); if(errIf(document.getElementById('r-info'), p<=0||t<=0||a<=0||a>30)) return;
    const r=hipoteca(p,t,a); setHTML('r-info','<div class="big">'+fmt(r.mensual)+'</div><p class="muted">Mensualidad estimada</p>'+rows([['Monto del crédito',fmt(p)],['Tasa anual',t+'%'],['Plazo',a+' años ('+r.n+' pagos)'],['Total a pagar',fmt(r.total)],['Intereses totales',fmt(r.intereses)]])+'<p class="small">Estimación con tasa fija. Infonavit cobra entre 3.69% y 10.45% anual según tu nivel salarial; confirma tu tasa y precalificación en Mi Cuenta Infonavit.</p>'); });
  // Porcentajes
  bind('f-p1', ()=>{ const x=val('p1-x'), y=val('p1-y'); if(errIf(document.getElementById('r-p1'), y===0)) return; setHTML('r-p1','<div class="big">'+fmt(x*y/100)+'</div><p>'+x+'% de '+fmt(y)+' = '+fmt(x*y/100)+'</p>'); });
  bind('f-p2', ()=>{ const x=val('p2-x'), y=val('p2-y'); if(errIf(document.getElementById('r-p2'), y===0)) return; setHTML('r-p2','<div class="big">'+r2(x/y*100)+'%</div><p>'+fmt(x)+' es el '+r2(x/y*100)+'% de '+fmt(y)+'</p>'); });
  bind('f-p3', ()=>{ const a=val('p3-a'), b=val('p3-b'); if(errIf(document.getElementById('r-p3'), a===0)) return; setHTML('r-p3','<div class="big">'+r2((b-a)/a*100)+'%</div><p>De '+fmt(a)+' a '+fmt(b)+': diferencia '+fmt(b-a)+'</p>'); });
  // Regla de tres
  bind('f-r3s', ()=>{ const a=val('r3-a'), b=val('r3-b'), c=val('r3-c'), inv=document.getElementById('r3-tipo').value==='inversa'; if(errIf(document.getElementById('r-r3s'), a===0||c===0)) return; const x=inv? r2(a*b/c): r2(b*c/a); setHTML('r-r3s','<div class="big">X = '+x.toLocaleString('es-MX')+'</div><p>'+(inv?'Inversa: X = (A × B) ÷ C':'Directa: X = (B × C) ÷ A')+'</p>'); });
  bind('f-r3c', ()=>{ const v=val('r3-v'), f1=val('r3-f1'), f2=val('r3-f2'); if(errIf(document.getElementById('r-r3c'), v===0)) return; setHTML('r-r3c','<div class="big">X = '+r2(v*f1*f2).toLocaleString('es-MX')+'</div><p>X = valor conocido × factor 1 × factor 2</p>'); });
  // IVA Argentina
  bind('f-iva-ar', ()=>{ const m=val('ivaar-monto'), t=val('ivaar-tasa')/100, modo=document.getElementById('ivaar-modo').value; if(errIf(document.getElementById('r-iva-ar'), m<=0)) return;
    const r=ivaCalc(m,t,modo); setHTML('r-iva-ar','<div class="big">'+fmt(r.total,'ARS')+'</div><p class="muted">Total</p>'+rows([['Monto sin IVA',fmt(r.neto,'ARS')],['IVA ('+(t*100)+'%)',fmt(r.iva,'ARS')],['Total',fmt(r.total,'ARS')]])); });
  // Sueldo neto Argentina
  bind('f-sueldo-ar', ()=>{ const b=val('snar-bruto'); if(errIf(document.getElementById('r-sueldo-ar'), b<=0)) return;
    const r=sueldoNetoAR(b); setHTML('r-sueldo-ar','<div class="big">'+fmt(r.neto,'ARS')+'</div><p class="muted">Sueldo neto estimado (solo aportes)</p>'+rows([['Sueldo bruto',fmt(r.bruto,'ARS')],['Base de aportes (tope ANSES)',fmt(r.base,'ARS')],['Aportes 17% (jubilación 11% + PAMI 3% + obra social 3%)',fmt(r.aportes,'ARS')]])+'<p class="small">No incluye el Impuesto a las Ganancias ni cuota sindical. Tope ANSES de octubre de 2026: $4,769,631.49 — puede cambiar.</p>'); });
  // Aguinaldo Argentina
  bind('f-aguinaldo-ar', ()=>{ const m=val('agar-mejor'), me=val('agar-meses'); if(errIf(document.getElementById('r-aguinaldo-ar'), m<=0||me<0||me>6)) return;
    const r=aguinaldoAR(m,me); setHTML('r-aguinaldo-ar','<div class="big">'+fmt(r.bruto,'ARS')+'</div><p class="muted">Aguinaldo bruto — neto estimado: '+fmt(r.netoEst,'ARS')+'</p>'+rows([['Mejor sueldo del semestre',fmt(m,'ARS')],['Meses trabajados',me+' de 6'],['Aportes 17%',fmt(r.aportes,'ARS')]])); });
  // Basic + scientific calculator (homepage + científica page)
  document.querySelectorAll('.calc-engine').forEach(engine=>{
    const disp=engine.querySelector('.display'), hist=engine.querySelector('.history');
    let expr='', deg=true;
    const render=()=>{ disp.value=expr||'0'; };
    const fact=n=>{ n=Math.floor(n); if(n<0) return NaN; let f=1; for(let i=2;i<=n;i++) f*=i; return f; };
    const calc=()=>{ try{ let e=expr.replace(/\^/g,'**').replace(/π/g,'Math.PI').replace(/\be\b/g,'Math.E')
      .replace(/√\(/g,'Math.sqrt(').replace(/sin\(/g,'Math.sin(').replace(/cos\(/g,'Math.cos(').replace(/tan\(/g,'Math.tan(')
      .replace(/ln\(/g,'Math.log(').replace(/log\(/g,'Math.log10(');
      if(deg) e=e.replace(/Math\.sin\(/g,'Math.sin((Math.PI/180)*').replace(/Math\.cos\(/g,'Math.cos((Math.PI/180)*').replace(/Math\.tan\(/g,'Math.tan((Math.PI/180)*');
      // close the extra paren added for trig: handled by counting — simpler: evaluate with helper functions
      const sin=x=>Math.sin(deg?x*Math.PI/180:x), cos=x=>Math.cos(deg?x*Math.PI/180:x), tan=x=>Math.tan(deg?x*Math.PI/180:x);
      const fn=new Function('sin','cos','tan','sqrt','ln','log','fact','Math','return ('+expr.replace(/\^/g,'**').replace(/π/g,'Math.PI').replace(/√\(/g,'sqrt(').replace(/ln\(/g,'ln(').replace(/log\(/g,'log(')+')');
      const v=fn(sin,cos,tan,Math.sqrt,Math.log,Math.log10,fact,Math);
      if(typeof v!=='number'||!isFinite(v)) throw new Error('bad');
      if(hist) hist.textContent=expr+' = '+r2(v);
      expr=String(r2(v)); render();
    }catch(err){ disp.value='Error'; expr=''; } };
    engine.querySelectorAll('[data-k]').forEach(b=>b.addEventListener('click',()=>{
      const k=b.getAttribute('data-k');
      if(k==='C'){expr=''; if(hist) hist.textContent='';}
      else if(k==='⌫'){expr=expr.slice(0,-1);}
      else if(k==='='){calc(); return;}
      else if(k==='DEG'){deg=!deg; b.textContent=deg?'DEG':'RAD'; return;}
      else expr+=k;
      render();
    }));
    engine.addEventListener('keydown', e=>{ if(e.key==='Enter'){calc();} });
    render();
  });
});
}
if (typeof module!=='undefined' && module.exports){ module.exports={r2,isrMensual,imssObrero,sueldoNetoMX,aguinaldoMX,primaVacacional,vacacionesDias,finiquitoMX,liquidacionMX,ivaCalc,hipoteca,sueldoNetoAR,aguinaldoAR,UMA_D,SMG_D}; }
