let state={layout:'two',color:'black'};

const asset=(ext)=>`assets/ccyps-logo-${state.layout}-${state.color}.${ext}`;

function render(){
  const preview=document.getElementById('logoPreview');
  preview.classList.toggle('dark',state.color==='white');
  preview.innerHTML=`<img class="vector-lockup" src="${asset('svg')}" alt="Logo CCYPS">`;
}

document.querySelectorAll('#logoLayouts button').forEach(button=>{
  button.addEventListener('click',()=>{
    document.querySelectorAll('#logoLayouts button').forEach(x=>x.classList.remove('active'));
    button.classList.add('active');
    state.layout=button.dataset.layout;
    render();
  });
});

document.querySelectorAll('#logoColors button').forEach(button=>{
  button.addEventListener('click',()=>{
    document.querySelectorAll('#logoColors button').forEach(x=>x.classList.remove('active'));
    button.classList.add('active');
    state.color=button.dataset.color;
    render();
  });
});

function download(url,name){
  const a=document.createElement('a');
  a.href=url;a.download=name;
  document.body.appendChild(a);a.click();a.remove();
}
function flash(button,message){
  const old=button.textContent;
  button.textContent=message;
  setTimeout(()=>button.textContent=old,1200);
}

document.getElementById('exportLogoSVG').addEventListener('click',()=>{
  download(asset('svg'),`ccyps-logo-${state.layout}-${state.color}.svg`);
});
document.getElementById('exportLogoPNG').addEventListener('click',()=>{
  download(asset('png'),`ccyps-logo-${state.layout}-${state.color}.png`);
});

document.getElementById('copyLogoSVG').addEventListener('click',async()=>{
  const button=document.getElementById('copyLogoSVG');
  try{
    const response=await fetch(asset('svg'));
    if(!response.ok) throw new Error('SVG unavailable');
    await navigator.clipboard.writeText(await response.text());
    flash(button,'Đã copy');
  }catch(error){
    console.error(error);
    flash(button,'Không thể copy');
  }
});

document.getElementById('copyLogoPNG').addEventListener('click',async()=>{
  const button=document.getElementById('copyLogoPNG');
  try{
    const response=await fetch(asset('png'));
    if(!response.ok) throw new Error('PNG unavailable');
    const blob=await response.blob();
    await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
    flash(button,'Đã copy');
  }catch(error){
    console.error(error);
    flash(button,'Trình duyệt chặn');
  }
});

render();
