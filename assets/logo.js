
const CCYPS_VIEWBOX='0 0 565.1 626.11';
const CCYPS_PATHS='<path d="M180.47,294.41c-.13,1.75-.3,3.51-.48,5.28,9.62-17.51,21.6-35.39,35.81-53.4.7-.89,1.2-1.52,1.48-1.89,27.9-39.95,51.11-64.79,69.75-84.74,27.2-29.11,43.61-46.68,52.14-87.4,1.9-9.05,3.72-49.4-21.88-71.34-16.22,1.31-31.83,3.9-46.55,7.6-82.94,14.25-141.24,60.55-153.96,71.02-1.7,1.4-4.75,3.96-8.79,7.62,20.96,25.06,39.4,56.63,52.42,89.99,15.86,40.6,22.79,81.15,20.05,117.28Z"/><path d="M.02,324.16c.27,23.94,3.97,91.86,44.8,156.3,1.63-1.2,3.26-2.43,4.9-3.7,48.57-37.74,100.13-109.35,105.81-184.25,5.24-69-29.07-143.44-65.42-187.78C54.74,142.26-1.19,218.31.02,324.16Z"/><path d="M363.64,77.37c-9.97,47.56-30.26,69.28-58.34,99.34-18.12,19.39-40.66,43.52-67.56,82.05-.47.68-1.09,1.45-2.31,3-8.26,10.47-15.7,20.86-22.29,31.12,36.33-25.59,85.25-36.27,134.05-45.18,42.78-6.57,82.43-10.97,115.48-25.29,27.54-13.22,52.88-29.27,64.99-56.61.35-.79.68-1.57,1.01-2.36,2.07-5.06,4.5-11.53,5.6-17.03,1.1-8.81,2.2-14.53,2.2-22.58,0-66.91-83.2-121.42-187.25-123.83,18.39,28.81,17.11,64.6,14.43,77.37Z"/><path d="M547.48,496.71c-51.48,89.36-183.27,151.66-283.09,103.75-64.4-30.91-89.51-95.22-95.83-113.58-2.3-6.67-11.31-34.01-12.56-67.71-.52-14.15.32-29.42,3.61-44.76-2.23,5.07-4.63,10.13-7.19,15.17-3.49,6.86-7.28,13.68-11.37,20.44-20.27,33.46-47.25,64.18-75.97,86.5-1.96,1.52-3.91,2.99-5.85,4.41,1.18,1.51,2.37,3.02,3.6,4.53,127.87,156.88,430.08,148.16,502.29,46.13v-101.89c-3.28,14.05-8.45,31.1-17.62,47.02Z"/>';
let state={layout:'two',color:'black'};
const ORG='Climate Conscious Young Professionals Society';

function markSVG(){return `<svg viewBox="${CCYPS_VIEWBOX}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${CCYPS_PATHS}</svg>`}
function render(){
 const p=document.getElementById('logoPreview'); p.classList.toggle('dark',state.color==='white');
 p.innerHTML=state.layout==='symbol'?`<div class="lockup symbol">${markSVG()}</div>`:
 state.layout==='one'?`<div class="lockup one">${markSVG()}<div class="logo-name">${ORG}</div></div>`:
 `<div class="lockup two">${markSVG()}<div class="logo-name">Climate Conscious<br>Young Professionals Society</div></div>`;
 fit();
}
function fit(){
 const card=document.getElementById('logoPreview'), el=card.querySelector('.lockup'); if(!el)return;
 el.style.transform='translate(-50%,-50%) scale(1)';
 requestAnimationFrame(()=>{
  const aw=Math.max(1,card.clientWidth-48), ah=Math.max(1,card.clientHeight-48);
  const sc=Math.min(1,aw/Math.max(1,el.scrollWidth),ah/Math.max(1,el.scrollHeight));
  el.style.transform=`translate(-50%,-50%) scale(${sc})`;
 });
}
document.querySelectorAll('#logoLayouts button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#logoLayouts button').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.layout=b.dataset.layout;render()});
document.querySelectorAll('#logoColors button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#logoColors button').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.color=b.dataset.color;render()});
const asset=(ext)=>`assets/ccyps-logo-${state.layout}-${state.color}.${ext}`;
function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove()}
document.getElementById('exportLogoSVG').onclick=()=>download(asset('svg'),`ccyps-logo_${state.layout}_${state.color}.svg`);
document.getElementById('exportLogoPNG').onclick=()=>download(asset('png'),`ccyps-logo_${state.layout}_${state.color}.png`);
async function flash(btn,msg){const old=btn.textContent;btn.textContent=msg;setTimeout(()=>btn.textContent=old,1200)}
document.getElementById('copyLogoSVG').onclick=async()=>{const b=document.getElementById('copyLogoSVG');try{const t=await fetch(asset('svg')).then(r=>r.text());await navigator.clipboard.writeText(t);flash(b,'Đã copy')}catch(e){flash(b,'Không thể copy')}};
document.getElementById('copyLogoPNG').onclick=async()=>{const b=document.getElementById('copyLogoPNG');try{const blob=await fetch(asset('png')).then(r=>{if(!r.ok)throw Error();return r.blob()});await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);flash(b,'Đã copy')}catch(e){console.error(e);flash(b,'Trình duyệt chặn')}};
new ResizeObserver(fit).observe(document.getElementById('logoPreview')); window.addEventListener('resize',fit); render();
