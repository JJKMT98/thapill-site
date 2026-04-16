// ===== LOADER =====
const loaderMsgs=['Initializing...','Loading formula...','Calibrating dosage...','Checking aura levels...','Entering flow state...'];
let msgIdx=0,pct=0;
const loaderText=document.getElementById('loaderText'),loaderPct=document.getElementById('loaderPercent');
const pctI=setInterval(()=>{pct=Math.min(100,pct+Math.floor(Math.random()*4)+1);loaderPct.textContent=pct+'%';if(pct>=100)clearInterval(pctI);},35);
const msgI=setInterval(()=>{msgIdx++;if(msgIdx<loaderMsgs.length)loaderText.textContent=loaderMsgs[msgIdx];},400);
setTimeout(()=>{clearInterval(msgI);document.getElementById('loader').classList.add('done');},2200);

// ===== PILL CURSOR =====
const pillCursor=document.getElementById('pillCursor'),cursorAura=document.getElementById('cursorAura');
let mx=0,my=0,cx=0,cy=0,ax=0,ay=0;
const trail=[];
for(let i=0;i<14;i++){const p=document.createElement('div');p.className='trail-particle';p.style.width=(4-i/14*3)+'px';p.style.height=p.style.width;document.body.appendChild(p);trail.push({el:p,x:0,y:0});}
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;});
document.addEventListener('mousedown',()=>pillCursor.classList.add('clicking'));
document.addEventListener('mouseup',()=>pillCursor.classList.remove('clicking'));
function animCursor(){
  cx+=(mx-cx)*0.35;cy+=(my-cy)*0.35;
  pillCursor.style.transform=`translate(${cx-14}px,${cy-7}px) rotate(${(mx-cx)*0.8}deg)`;
  ax+=(mx-ax)*0.06;ay+=(my-ay)*0.06;
  cursorAura.style.left=ax+'px';cursorAura.style.top=ay+'px';
  let px=cx,py=cy;
  for(let i=0;i<trail.length;i++){const t=trail[i];t.x+=(px-t.x)*(0.35-i*0.018);t.y+=(py-t.y)*(0.35-i*0.018);t.el.style.transform=`translate(${t.x}px,${t.y}px)`;t.el.style.opacity=(1-i/trail.length)*0.5;px=t.x;py=t.y;}
  requestAnimationFrame(animCursor);
}
animCursor();
document.querySelectorAll('a,button,.ingredient-card,.price-card,.float-badge,.social-card').forEach(el=>{el.addEventListener('mouseenter',()=>pillCursor.classList.add('hovering'));el.addEventListener('mouseleave',()=>pillCursor.classList.remove('hovering'));});

// ===== PARTICLES =====
const canvas=document.getElementById('particleCanvas'),ctx=canvas.getContext('2d');
let W,H;function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;}
resize();window.addEventListener('resize',resize);
const pts=[];for(let i=0;i<70;i++)pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*0.3,vy:(Math.random()-0.5)*0.3,r:Math.random()*1.5+0.5,a:Math.random()*0.3+0.05});
function drawP(){
  ctx.clearRect(0,0,W,H);
  for(const p of pts){
    p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;
    const dx=mx-p.x,dy=my-p.y,dist=Math.sqrt(dx*dx+dy*dy),inf=Math.max(0,1-dist/300);
    p.x+=dx*inf*0.004;p.y+=dy*inf*0.004;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r+inf*2.5,0,Math.PI*2);ctx.fillStyle=`rgba(0,255,136,${p.a+inf*0.5})`;ctx.fill();
    if(inf>0.15){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(mx,my);ctx.strokeStyle=`rgba(0,255,136,${inf*0.08})`;ctx.lineWidth=0.5;ctx.stroke();}
    for(const q of pts){const d=Math.sqrt((p.x-q.x)**2+(p.y-q.y)**2);if(d<120&&d>0){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=`rgba(0,255,136,${0.03*(1-d/120)})`;ctx.lineWidth=0.5;ctx.stroke();}}
  }
  requestAnimationFrame(drawP);
}
drawP();

// ===== NAV + SCROLL PROGRESS =====
const nav=document.getElementById('nav'),scrollProg=document.getElementById('scrollProgress');
window.addEventListener('scroll',()=>{
  nav.classList.toggle('scrolled',window.scrollY>50);
  const max=document.documentElement.scrollHeight-window.innerHeight;
  scrollProg.style.width=(window.scrollY/max*100)+'%';
});

// ===== SCROLL REVEALS (all types) =====
const allReveals=document.querySelectorAll('.reveal,.clip-reveal,.clip-reveal-up,.clip-reveal-center,.scale-reveal');
const rObs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:0.08,rootMargin:'0px 0px -30px 0px'});
allReveals.forEach(el=>rObs.observe(el));

// ===== PARALLAX BACKGROUNDS ON SCROLL =====
const heroBg=document.getElementById('heroBg'),pillBg=document.getElementById('pillBg'),socialBg=document.getElementById('socialBg');
function parallaxScroll(){
  const s=window.scrollY;
  if(heroBg)heroBg.style.transform=`translateY(${s*0.06}px)`;
  if(pillBg)pillBg.style.transform=`translateY(${(s-pillBg.parentElement.offsetTop)*0.04}px)`;
  if(socialBg)socialBg.style.transform=`translateY(${(s-socialBg.parentElement.offsetTop)*0.03}px)`;
}
window.addEventListener('scroll',parallaxScroll,{passive:true});

// ===== HERO BOTTLE 3D TILT ON MOUSE =====
const heroBottle=document.getElementById('heroBottle');
const heroSection=document.getElementById('heroSection');
heroSection.addEventListener('mousemove',e=>{
  const rect=heroSection.getBoundingClientRect();
  const x=(e.clientX-rect.left)/rect.width-0.5;
  const y=(e.clientY-rect.top)/rect.height-0.5;
  if(heroBottle){
    heroBottle.style.transform=`translateY(${Math.sin(Date.now()/800)*15}px) rotateY(${x*20}deg) rotateX(${-y*12}deg) scale(1.02)`;
  }
});
heroSection.addEventListener('mouseleave',()=>{if(heroBottle)heroBottle.style.transform='';});

// ===== CAPSULE 3D TILT =====
const capsuleImg=document.getElementById('capsuleImg');
if(capsuleImg){
  capsuleImg.parentElement.addEventListener('mousemove',e=>{
    const rect=capsuleImg.parentElement.getBoundingClientRect();
    const x=(e.clientX-rect.left)/rect.width-0.5;
    const y=(e.clientY-rect.top)/rect.height-0.5;
    capsuleImg.style.transform=`rotate(${3+x*15}deg) scale(${1.1+Math.abs(x)*0.1}) translateY(${-15+y*10}px)`;
  });
  capsuleImg.parentElement.addEventListener('mouseleave',()=>{capsuleImg.style.transform='';});
}

// ===== SHOWCASE 3D TILT =====
const showcaseBottle=document.getElementById('showcaseBottle');
if(showcaseBottle){
  showcaseBottle.parentElement.addEventListener('mousemove',e=>{
    const rect=showcaseBottle.parentElement.getBoundingClientRect();
    const x=(e.clientX-rect.left)/rect.width-0.5;
    const y=(e.clientY-rect.top)/rect.height-0.5;
    showcaseBottle.style.transform=`translateY(${-10+Math.sin(Date.now()/1000)*10}px) rotateY(${x*15}deg) rotateX(${-y*8}deg) scale(1.05)`;
  });
  showcaseBottle.parentElement.addEventListener('mouseleave',()=>{showcaseBottle.style.transform='';});
}

// ===== COUNTER =====
document.querySelectorAll('.badge-num[data-count]').forEach(el=>{
  const obs=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){const target=parseInt(el.dataset.count),suffix=el.dataset.suffix||'';let cur=0;const inc=Math.max(1,Math.floor(target/25));const t=setInterval(()=>{cur+=inc;if(cur>=target){cur=target;clearInterval(t);}el.textContent=cur+suffix;},25);obs.unobserve(el);}});},{threshold:0.5});
  obs.observe(el);
});

// ===== TEXT SCRAMBLE =====
class Scramble{
  constructor(el){this.el=el;this.chars='!<>-_\\/[]{}—=+*^?#_';this.queue=[];this.frame=0;this.resolve=null;this.raf=null;}
  setText(t){const old=this.el.innerText,len=Math.max(old.length,t.length);return new Promise(r=>{this.resolve=r;this.queue=[];for(let i=0;i<len;i++){const f=old[i]||'',to=t[i]||'';this.queue.push({from:f,to,start:Math.floor(Math.random()*15),end:Math.floor(Math.random()*15)+15,char:null});}cancelAnimationFrame(this.raf);this.frame=0;this.update();});}
  update(){let out='',done=0;for(let i=0;i<this.queue.length;i++){let{from,to,start,end,char}=this.queue[i];if(this.frame>=end){done++;out+=to;}else if(this.frame>=start){if(!char||Math.random()<0.3){char=this.chars[Math.floor(Math.random()*this.chars.length)];this.queue[i].char=char;}out+=`<span style="color:var(--text-dim)">${char}</span>`;}else out+=from;}this.el.innerHTML=out;if(done===this.queue.length)this.resolve();else{this.raf=requestAnimationFrame(()=>this.update());this.frame++;}}
}
const heroWord=document.getElementById('heroWord');
if(heroWord){const sObs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){const fx=new Scramble(heroWord);const words=['different.','unstoppable.','locked in.','relentless.','different.'];let wi=0;const next=()=>{fx.setText(words[wi]).then(()=>setTimeout(next,2200));wi=(wi+1)%words.length;};setTimeout(next,600);sObs.unobserve(heroWord);}});},{threshold:0.5});sObs.observe(heroWord);}

// ===== MAGNETIC BUTTONS =====
document.querySelectorAll('.mag-btn').forEach(btn=>{
  btn.addEventListener('mousemove',e=>{const r=btn.getBoundingClientRect();const x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;btn.style.transform=`translate(${x*0.3}px,${y*0.3}px) scale(1.05)`;});
  btn.addEventListener('mouseleave',()=>{btn.style.transform='translate(0,0) scale(1)';});
});

// ===== CARD SPOTLIGHT + TILT =====
document.querySelectorAll('.ingredient-card').forEach(card=>{
  card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;card.style.setProperty('--mouse-x',x*100+'%');card.style.setProperty('--mouse-y',y*100+'%');card.style.transform=`translateY(-10px) perspective(600px) rotateY(${(x-0.5)*10}deg) rotateX(${-(y-0.5)*10}deg)`;});
  card.addEventListener('mouseleave',()=>{card.style.transform='';});
});
document.querySelectorAll('.price-card').forEach(card=>{
  card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-0.5,y=(e.clientY-r.top)/r.height-0.5;card.style.transform=`translateY(-8px) perspective(600px) rotateY(${x*8}deg) rotateX(${-y*8}deg)`;});
  card.addEventListener('mouseleave',()=>{card.style.transform='';});
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',function(e){e.preventDefault();const t=document.querySelector(this.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth',block:'start'});});});

// ===== IMAGE LAZY REVEAL =====
document.querySelectorAll('img[src]').forEach(img=>{
  if(img.closest('.loader'))return;
  img.style.opacity='0';img.style.transition='opacity 1.2s cubic-bezier(0.16,1,0.3,1)';
  const show=()=>{img.style.opacity='';};
  if(img.complete)show();else img.addEventListener('load',show);
});
