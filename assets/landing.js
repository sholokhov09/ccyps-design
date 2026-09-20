(() => {
  const canvas=document.getElementById('landingPatternCanvas');
  if(!canvas)return;

  const gl=canvas.getContext('webgl2',{antialias:false,alpha:true});
  if(!gl)return;

  const vs=`#version 300 es
  in vec2 a_position;
  out vec2 v_uv;
  void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;

  const fs=`#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 outColor;
  uniform vec2 u_resolution;

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
    float density=.62,scale=.46,turbulence=.54,whirl=.58,seedValue=482.0;
    vec2 uv=v_uv;
    float aspect=u_resolution.x/u_resolution.y;
    vec2 p=(uv-.5)*vec2(aspect,1.);
    float seed=seedValue*.0137;
    const float fixedRadius=.48;
    const float fixedContrast=.61;

    for(int i=0;i<6;i++){
      float fi=float(i);
      vec2 c=vec2(hash21(vec2(seed+fi*2.17,3.1)),hash21(vec2(8.7,seed+fi*4.73)))-.5;
      c.x*=aspect*.92;c.y*=.92;
      float dir=hash21(vec2(fi+seed,12.4))>.5?1.:-1.;
      float rr=mix(.12,.52,fixedRadius)*(.72+.5*hash21(vec2(seed,fi+33.)));
      p=vortex(p,c,rr,dir*whirl*3.4);
    }

    float sc=mix(1.7,7.5,scale);
    vec2 q=vec2(fbm(p*sc+seed),fbm(p*sc+vec2(4.8,1.3)+seed*.7));
    vec2 r=vec2(
      fbm(p*sc*1.18+q*(1.4+turbulence*3.2)+vec2(1.7,9.2)),
      fbm(p*sc*1.18+q*(1.4+turbulence*3.2)+vec2(8.3,2.8))
    );

    float broad=fbm(p*mix(.75,2.,density)+r*turbulence*2.4+seed*.21);
    float detail=fbm(p*sc*1.7+r*(2.+turbulence*3.)+seed);
    float ridges=1.-abs(2.*detail-1.);
    float field=mix(broad,detail,mix(.28,.68,density));
    field=mix(field,field*.72+ridges*.28,turbulence*.58);
    field+=(density-.5)*.20;

    float k=mix(.75,2.15,fixedContrast);
    field=(field-.5)*k+.5;
    float bandAmount=.10+.12*fixedContrast;
    float bands=mix(field,floor(field*13.)/13.,bandAmount);
    float grain=(hash21(gl_FragCoord.xy+seedValue)-.5)*.018;
    outColor=vec4(palette(clamp(bands+grain,0.,1.)),1.);
  }`;

  function shader(type,src){
    const s=gl.createShader(type);
    gl.shaderSource(s,src);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  try{
    const program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));

    const vao=gl.createVertexArray();
    gl.bindVertexArray(vao);

    const buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);

    const pos=gl.getAttribLocation(program,'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);

    const resolution=gl.getUniformLocation(program,'u_resolution');

    function render(){
      const rect=canvas.getBoundingClientRect();
      const dpr=Math.min(window.devicePixelRatio||1,2);
      const w=Math.max(1,Math.round(rect.width*dpr));
      const h=Math.max(1,Math.round(rect.height*dpr));

      if(canvas.width!==w||canvas.height!==h){
        canvas.width=w;
        canvas.height=h;
      }

      gl.viewport(0,0,w,h);
      gl.useProgram(program);
      gl.uniform2f(resolution,w,h);
      gl.drawArrays(gl.TRIANGLES,0,6);
    }

    new ResizeObserver(render).observe(canvas);
    render();
  }catch(err){
    console.warn('Landing pattern preview fallback:',err);
  }
})();
