const canvas=document.getElementById('glcanvas');
const gl=canvas.getContext('webgl2',{antialias:false,preserveDrawingBuffer:true});
if(!gl){document.body.innerHTML='<p style="padding:2rem">Trình duyệt cần hỗ trợ WebGL2 để chạy bộ tạo họa tiết này.</p>';throw new Error('WebGL2 unavailable');}

const vs=`#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;

// Pass 1: generate the full-detail thermal field. Blur is deliberately absent here.
// That keeps temperature/color distribution independent from spatial softening.
const fieldFS=`#version 300 es
precision highp float;
in vec2 v_uv;out vec4 outColor;
uniform vec2 u_resolution;
uniform float u_density,u_scale,u_turbulence,u_whirl,u_seed;
float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash21(i);float b=hash21(i+vec2(1,0));float c=hash21(i+vec2(0,1));float d=hash21(i+vec2(1));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p+0.17;a*=.5;}return v;}
vec2 vortex(vec2 p,vec2 c,float radius,float strength){vec2 d=p-c;float r=length(d);float influence=exp(-pow(r/max(radius,.001),2.0));float ang=strength*influence;float cs=cos(ang),sn=sin(ang);return c+mat2(cs,-sn,sn,cs)*d;}
vec3 palette(float t){
  vec3 c0=vec3(.027,.102,.322),c1=vec3(.082,.275,.722),c2=vec3(0.,.718,.898),c3=vec3(.514,.894,.357);
  vec3 c4=vec3(.953,.933,.227),c5=vec3(1.,.616,.098),c6=vec3(.957,.227,.114),c7=vec3(.722,.059,.102);
  t=clamp(t,0.,1.);
  if(t<.15)return mix(c0,c1,smoothstep(0.,.15,t));
  if(t<.30)return mix(c1,c2,smoothstep(.15,.30,t));
  if(t<.45)return mix(c2,c3,smoothstep(.30,.45,t));
  if(t<.58)return mix(c3,c4,smoothstep(.45,.58,t));
  if(t<.72)return mix(c4,c5,smoothstep(.58,.72,t));
  if(t<.87)return mix(c5,c6,smoothstep(.72,.87,t));
  return mix(c6,c7,smoothstep(.87,1.,t));
}
void main(){
  vec2 uv=v_uv;float aspect=u_resolution.x/u_resolution.y;
  vec2 p=(uv-.5)*vec2(aspect,1.);float seed=u_seed*.0137;
  // Whirl radius and contrast are now fixed parts of the visual system rather than user controls.
  const float fixedRadius=.48;
  const float fixedContrast=.61;
  for(int i=0;i<6;i++){
    float fi=float(i);
    vec2 c=vec2(hash21(vec2(seed+fi*2.17,3.1)),hash21(vec2(8.7,seed+fi*4.73)))-.5;
    c.x*=aspect*.92;c.y*=.92;
    float dir=hash21(vec2(fi+seed,12.4))>.5?1.:-1.;
    float rr=mix(.12,.52,fixedRadius)*(.72+.5*hash21(vec2(seed,fi+33.)));
    p=vortex(p,c,rr,dir*u_whirl*3.4);
  }
  float sc=mix(1.7,7.5,u_scale);
  vec2 q=vec2(fbm(p*sc+seed),fbm(p*sc+vec2(4.8,1.3)+seed*.7));
  vec2 r=vec2(fbm(p*sc*1.18+q*(1.4+u_turbulence*3.2)+vec2(1.7,9.2)),fbm(p*sc*1.18+q*(1.4+u_turbulence*3.2)+vec2(8.3,2.8)));
  float broad=fbm(p*mix(.75,2.,u_density)+r*u_turbulence*2.4+seed*.21);
  float detail=fbm(p*sc*1.7+r*(2.+u_turbulence*3.)+seed);
  float ridges=1.-abs(2.*detail-1.);
  float field=mix(broad,detail,mix(.28,.68,u_density));
  field=mix(field,field*.72+ridges*.28,u_turbulence*.58);
  field+=(u_density-.5)*.20;
  float k=mix(.75,2.15,fixedContrast);
  field=(field-.5)*k+.5;
  float bandAmount=.10+.12*fixedContrast;
  float bands=mix(field,floor(field*13.)/13.,bandAmount);
  float grain=(hash21(gl_FragCoord.xy+u_seed)-.5)*.018;
  outColor=vec4(palette(clamp(bands+grain,0.,1.)),1.);
}`;

// Passes 2–7: separable Gaussian blur. Three H/V passes create a genuinely
// Gaussian-like softening instead of changing the procedural field itself.
const blurFS=`#version 300 es
precision highp float;
in vec2 v_uv;out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_texel;
uniform vec2 u_direction;
uniform float u_radius;
void main(){
  if(u_radius<.01){outColor=texture(u_texture,v_uv);return;}
  vec2 d=u_texel*u_direction*u_radius;
  // 9-tap bilinear-optimized Gaussian kernel.
  vec3 c=texture(u_texture,v_uv).rgb*.2270270270;
  c+=texture(u_texture,v_uv+d*1.3846153846).rgb*.3162162162;
  c+=texture(u_texture,v_uv-d*1.3846153846).rgb*.3162162162;
  c+=texture(u_texture,v_uv+d*3.2307692308).rgb*.0702702703;
  c+=texture(u_texture,v_uv-d*3.2307692308).rgb*.0702702703;
  outColor=vec4(c,1.);
}`;

function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
function makeProgram(fs){const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
const fieldProgram=makeProgram(fieldFS),blurProgram=makeProgram(blurFS);
const vao=gl.createVertexArray();gl.bindVertexArray(vao);
const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
for(const p of [fieldProgram,blurProgram]){const loc=gl.getAttribLocation(p,'a_position');gl.useProgram(p);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);}

const FU={resolution:gl.getUniformLocation(fieldProgram,'u_resolution'),density:gl.getUniformLocation(fieldProgram,'u_density'),scale:gl.getUniformLocation(fieldProgram,'u_scale'),turbulence:gl.getUniformLocation(fieldProgram,'u_turbulence'),whirl:gl.getUniformLocation(fieldProgram,'u_whirl'),seed:gl.getUniformLocation(fieldProgram,'u_seed')};
const BU={texture:gl.getUniformLocation(blurProgram,'u_texture'),texel:gl.getUniformLocation(blurProgram,'u_texel'),direction:gl.getUniformLocation(blurProgram,'u_direction'),radius:gl.getUniformLocation(blurProgram,'u_radius')};
let targets=[];
function destroyTargets(){for(const t of targets){gl.deleteTexture(t.tex);gl.deleteFramebuffer(t.fbo);}targets=[];}
function makeTarget(w,h){const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);return{tex,fbo,w,h};}
function ensureTargets(w,h){if(targets.length&&targets[0].w===w&&targets[0].h===h)return;destroyTargets();targets=[makeTarget(w,h),makeTarget(w,h)];gl.bindFramebuffer(gl.FRAMEBUFFER,null);}

let state={density:.62,scale:.46,turbulence:.54,whirl:.58,blur:0,seed:482,ratio:16/9,ratioName:'16:9'};
let target={...state},current={...state};
const ids=['density','scale','turbulence','whirl','blur'];
ids.forEach(id=>{const el=document.getElementById(id),out=document.querySelector(`[data-for="${id}"]`);const sync=()=>{target[id]=+el.value/100;out.textContent=String(el.value).padStart(2,'0');};el.addEventListener('input',sync);sync();});
function setSeed(n){state.seed=target.seed=current.seed=n;document.getElementById('seedText').textContent=n;updateLabel();}
function updateLabel(){document.getElementById('stageLabel').textContent=`${state.ratioName} / Họa tiết ${state.seed}`;}
function fitCanvas(){
  const shell=document.querySelector('.canvas-shell');
  const cs=getComputedStyle(shell);
  const padX=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);
  const padY=(parseFloat(cs.paddingTop)||0)+(parseFloat(cs.paddingBottom)||0);
  const w=Math.max(100,shell.clientWidth-padX);
  const h=Math.max(100,shell.clientHeight-padY);

  let cw=w;
  let ch=cw/state.ratio;
  if(ch>h){ch=h;cw=ch*state.ratio;}

  cw=Math.floor(cw);
  ch=Math.floor(ch);

  const dpr=Math.min(devicePixelRatio||1,2);
  const pixelW=Math.max(1,Math.round(cw*dpr));
  const pixelH=Math.max(1,Math.round(ch*dpr));

  canvas.style.width=cw+'px';
  canvas.style.height=ch+'px';

  if(canvas.width!==pixelW||canvas.height!==pixelH){
    canvas.width=pixelW;
    canvas.height=pixelH;
  }

  ensureTargets(pixelW,pixelH);
  gl.viewport(0,0,pixelW,pixelH);
}
new ResizeObserver(fitCanvas).observe(document.querySelector('.canvas-shell'));
document.querySelectorAll('#formats button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#formats button').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.ratio=+b.dataset.ratio;state.ratioName=b.dataset.name;updateLabel();fitCanvas();});
function randomize(){ids.forEach(id=>{const el=document.getElementById(id);let min=20,max=82;if(id==='scale'){min=28;max=72;}if(id==='blur'){min=0;max=78;}el.value=Math.round(min+Math.random()*(max-min));el.dispatchEvent(new Event('input'));});setSeed(Math.floor(100+Math.random()*900));}
document.getElementById('randomize').onclick=randomize;document.getElementById('newSeed').onclick=()=>setSeed(Math.floor(100+Math.random()*900));

function drawScene(values,w,h){
  ensureTargets(w,h);gl.bindVertexArray(vao);gl.viewport(0,0,w,h);
  gl.bindFramebuffer(gl.FRAMEBUFFER,targets[0].fbo);gl.useProgram(fieldProgram);
  gl.uniform2f(FU.resolution,w,h);gl.uniform1f(FU.density,values.density);gl.uniform1f(FU.scale,values.scale);gl.uniform1f(FU.turbulence,values.turbulence);gl.uniform1f(FU.whirl,values.whirl);gl.uniform1f(FU.seed,values.seed);gl.drawArrays(gl.TRIANGLES,0,6);
  const blur=values.blur;
  if(blur<.002){
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER,targets[0].fbo);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,null);gl.blitFramebuffer(0,0,w,h,0,0,w,h,gl.COLOR_BUFFER_BIT,gl.LINEAR);gl.bindFramebuffer(gl.FRAMEBUFFER,null);return;
  }
  gl.useProgram(blurProgram);gl.uniform1i(BU.texture,0);gl.uniform2f(BU.texel,1/w,1/h);
  // Nonlinear mapping gives fine control near zero and a strong Apple-like soft blur at the top.
  // Radius is expressed relative to the shorter image dimension so preview and export match visually.
  const px=(2.0+Math.pow(blur,1.55)*34.0)*(Math.min(w,h)/900);
  const perPass=px/Math.sqrt(3.0);
  let src=0,dst=1;
  for(let pass=0;pass<3;pass++){
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,targets[src].tex);gl.bindFramebuffer(gl.FRAMEBUFFER,targets[dst].fbo);gl.uniform2f(BU.direction,1,0);gl.uniform1f(BU.radius,perPass);gl.drawArrays(gl.TRIANGLES,0,6);[src,dst]=[dst,src];
    gl.bindTexture(gl.TEXTURE_2D,targets[src].tex);const last=pass===2;gl.bindFramebuffer(gl.FRAMEBUFFER,last?null:targets[dst].fbo);gl.uniform2f(BU.direction,0,1);gl.drawArrays(gl.TRIANGLES,0,6);if(!last)[src,dst]=[dst,src];
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
}
function render(){for(const id of ids)current[id]+=(target[id]-current[id])*.085;current.seed=target.seed;drawScene(current,canvas.width,canvas.height);requestAnimationFrame(render);}
function exportPNG(){
  const oldW=canvas.width,oldH=canvas.height,oldSW=canvas.style.width,oldSH=canvas.style.height;
  const long=2400;let w,h;if(state.ratio>=1){w=long;h=Math.round(long/state.ratio);}else{h=long;w=Math.round(long*state.ratio);}
  canvas.width=w;canvas.height=h;drawScene(target,w,h);
  const a=document.createElement('a');a.download=`solar-field_${state.seed}_${state.ratioName.replace(':','x')}.png`;a.href=canvas.toDataURL('image/png');a.click();
  canvas.width=oldW;canvas.height=oldH;canvas.style.width=oldSW;canvas.style.height=oldSH;ensureTargets(oldW,oldH);gl.viewport(0,0,oldW,oldH);
}
document.getElementById('export').onclick=exportPNG;
window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r')randomize();if(e.key.toLowerCase()==='e')exportPNG();});
setSeed(482);fitCanvas();render();