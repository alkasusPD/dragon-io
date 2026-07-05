const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const ui = { title: document.querySelector('#titleScreen'), lobby: document.querySelector('#lobbyScreen'), upgrade: document.querySelector('#upgrade'), over: document.querySelector('#gameover'), pause: document.querySelector('#pausePanel'), result: document.querySelector('#result'), cards: document.querySelector('#cards') };
const diveButton = document.querySelector('#dive');
const hud={root:document.querySelector('#hud'),hp:document.querySelector('#hudHp'),level:document.querySelector('#hudLevel'),score:document.querySelector('#hudScore'),wave:document.querySelector('#hudWave')};

const art = { player: new Image(), enemy: new Image(), bg: new Image(), shadow: new Image() };
art.player.src = 'assets/sprites/dragon-red.png';
art.enemy.src = 'assets/sprites/wyvern-blue.png';
art.bg.src = 'assets/backgrounds/sky-canyon.png';
art.shadow.src = 'assets/sprites/dragon-shadow.png';

let state = 'title', last = 0, time = 0, score = 0, wave = 1, spawnClock = 0, bgY = 0, waveBanner = 0;
let player, bullets = [], enemies = [], enemyShots = [], lasers = [], particles = [], gems = [];
const keys = new Set();
const pointer = { active: false, x: W / 2, y: H * .78 };
const rand = (a,b) => a + Math.random() * (b-a);
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const dist2 = (a,b) => (a.x-b.x)**2 + (a.y-b.y)**2;
function pointSegmentDistance2(px,py,x1,y1,x2,y2){const vx=x2-x1,vy=y2-y1,wx=px-x1,wy=py-y1,c1=vx*wx+vy*wy;if(c1<=0)return (px-x1)**2+(py-y1)**2;const c2=vx*vx+vy*vy;if(c2<=c1)return (px-x2)**2+(py-y2)**2;const t=c1/c2,qx=x1+t*vx,qy=y1+t*vy;return (px-qx)**2+(py-qy)**2;}

function reset() {
  player = { x:W/2, y:H*.78, r:18, speed:285, hp:100, maxHp:100, fire:.31, shot:0, damage:18, multishot:1, level:1, xp:0, need:35, inv:0, diving:false, altitude:1, diveTime:0, diveCooldown:0, wingmanLevel:0, wingShot:0 };
  bullets=[]; enemies=[]; enemyShots=[]; lasers=[]; particles=[]; gems=[]; time=score=spawnClock=bgY=0; wave=1; waveBanner=2.4; state='play';
  [ui.title,ui.lobby,ui.upgrade,ui.over,ui.pause].forEach(x=>x.classList.remove('visible'));
  hud.root.classList.add('visible');
  diveButton.classList.add('visible');
  updateDiveButton();
}

function spawnEnemy() {
  const tough=1+time/55, heavy=Math.random()<Math.min(.1+time/300,.28);
  const roll=Math.random(),pattern=heavy?(roll<.5?'laser':'burst'):(roll<.72?'orb':roll<.9?'burst':'laser');
  enemies.push({ x:rand(55,W-55), y:-75, r:heavy?30:18, hp:(heavy?95:30)*tough, max:(heavy?95:30)*tough, speed:rand(62,96)*(heavy?.72:1)*(1+time/240), sway:rand(1.2,3.4), phase:rand(0,7), damage:heavy?26:14, heavy, anim:rand(0,12), attack:rand(1.1,2.4), pattern, rotation:0, targetRotation:0 });
}

function enemyAttack(e){
  if(e.pattern==='orb'){
    const a=Math.atan2(player.y-e.y,player.x-e.x),speed=205+wave*4;
    enemyShots.push({type:'orb',x:e.x,y:e.y+18,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:8,life:6,damage:13});
  }else if(e.pattern==='burst'){
    const count=e.heavy?12:8,offset=time*.8;
    for(let i=0;i<count;i++){const a=offset+i*Math.PI*2/count,speed=e.heavy?155:135;enemyShots.push({type:'burst',x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:6,life:5,damage:10});}
  }else{
    const a=Math.atan2(player.y-e.y,player.x-e.x);
    e.targetRotation=a-Math.PI/2;
    lasers.push({source:e,x:e.x,y:e.y,dx:Math.cos(a),dy:Math.sin(a),age:0,warn:.85,active:.42,damage:24});
  }
  e.attack=rand(e.heavy?2.2:2.8,e.heavy?3.4:4.4);
}

function fire(){
  for(let i=0;i<player.multishot;i++){const a=(i-(player.multishot-1)/2)*.13;bullets.push({x:player.x,y:player.y-48,vx:Math.sin(a)*520,vy:-Math.cos(a)*720,r:5,damage:player.damage});}
  burst(player.x,player.y-44,'#fff19a',3,75);
}
function fireWingmen(){
  const offsets=player.wingmanLevel===1?[-1]:[-1,1];
  offsets.forEach(side=>bullets.push({x:player.x+side*55*player.altitude,y:player.y-10,vx:side*18,vy:-650,r:4,damage:player.damage*.48,wingman:true}));
  player.wingShot=.58;
}
function burst(x,y,color,n=8,speed=140){for(let i=0;i<n;i++){const a=rand(0,Math.PI*2),v=rand(speed*.35,speed);particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.2,.58),max:.58,color});}}

function update(dt){
  if(state!=='play')return;
  const bgTileHeight=art.bg.complete&&art.bg.naturalWidth?W*art.bg.naturalHeight/art.bg.naturalWidth:H*2;
  time+=dt;
  const nextWave=1+Math.floor(time/25);
  if(nextWave!==wave){wave=nextWave;waveBanner=2.4;burst(W/2,145,'#fff0a0',24,180);}
  waveBanner=Math.max(0,waveBanner-dt);
  bgY=(bgY+52*dt*(player.diving?.7:1))%bgTileHeight; player.inv-=dt;
  if(player.diving){
    player.diveTime=Math.max(0,player.diveTime-dt);
    if(player.diveTime<=0){player.diving=false;player.diveCooldown=2;burst(player.x,player.y,'#fff1a0',9,90);}
  }else if(player.diveCooldown>0){
    player.diveCooldown=Math.max(0,player.diveCooldown-dt);
  }
  updateDiveButton();
  const targetAltitude=player.diving?.62:1;
  player.altitude+=(targetAltitude-player.altitude)*Math.min(1,dt*7.5);
  let dx=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0),dy=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);
  if(pointer.active){dx=(pointer.x-player.x)/55;dy=(pointer.y-player.y)/55;}
  const len=Math.hypot(dx,dy)||1;if(Math.abs(dx)+Math.abs(dy)>0){player.x+=dx/Math.max(1,len)*player.speed*dt;player.y+=dy/Math.max(1,len)*player.speed*dt;}
  player.x=clamp(player.x,38,W-38);player.y=clamp(player.y,105,H-65);
  player.shot-=dt;player.wingShot-=dt;
  if(!player.diving&&player.shot<=0){fire();player.shot=player.fire;}
  if(!player.diving&&player.wingmanLevel>0&&player.wingShot<=0)fireWingmen();
  spawnClock-=dt;if(spawnClock<=0){spawnEnemy();spawnClock=Math.max(.55,1.22-time/260);}
  bullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;});
  enemies.forEach(e=>{
    e.y+=e.speed*dt;e.x+=Math.sin(time*e.sway+e.phase)*32*dt;e.anim+=dt*12;e.attack-=dt;
    const aimingLaser=lasers.some(l=>l.source===e);
    if(!aimingLaser)e.targetRotation=0;
    const turnDelta=Math.atan2(Math.sin(e.targetRotation-e.rotation),Math.cos(e.targetRotation-e.rotation));
    e.rotation+=turnDelta*Math.min(1,dt*(aimingLaser?7:3.2));
    if(e.y>85&&e.y<H*.7&&e.attack<=0)enemyAttack(e);
  });
  enemyShots.forEach(s=>{s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;});
  lasers.forEach(l=>{l.age+=dt;if(!l.source.dead){l.x=l.source.x;l.y=l.source.y;}});
  particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;});
  gems.forEach(g=>{const d=Math.hypot(player.x-g.x,player.y-g.y);if(d<135){g.x+=(player.x-g.x)*dt*7;g.y+=(player.y-g.y)*dt*7;}else g.y+=38*dt;});
  for(const b of bullets)for(const e of enemies)if(!b.dead&&!e.dead&&dist2(b,e)<(b.r+e.r)**2){b.dead=true;e.hp-=b.damage;burst(b.x,b.y,'#ffd267',4,85);if(e.hp<=0){e.dead=true;score+=e.heavy?35:10;gems.push({x:e.x,y:e.y,r:8,value:e.heavy?12:5});burst(e.x,e.y,e.heavy?'#ffb347':'#9c73ff',16,230);}}
  if(!player.diving&&player.altitude>.82)for(const e of enemies)if(!e.dead&&dist2(player,e)<(player.r+e.r)**2){e.dead=true;if(player.inv<=0){player.hp-=e.damage;player.inv=.75;burst(player.x,player.y,'#fff',18,250);if(player.hp<=0)return endGame();}}
  if(!player.diving&&player.altitude>.82&&player.inv<=0){
    for(const s of enemyShots)if(!s.dead&&dist2(player,s)<(player.r+s.r)**2){s.dead=true;player.hp-=s.damage;player.inv=.65;burst(player.x,player.y,'#ff8df3',13,210);if(player.hp<=0)return endGame();break;}
    if(player.inv<=0)for(const l of lasers)if(l.age>=l.warn&&l.age<l.warn+l.active){const x2=l.x+l.dx*1200,y2=l.y+l.dy*1200;if(pointSegmentDistance2(player.x,player.y,l.x,l.y,x2,y2)<(player.r+9)**2){player.hp-=l.damage;player.inv=.8;burst(player.x,player.y,'#ff554f',18,240);if(player.hp<=0)return endGame();break;}}
  }
  gems.forEach(g=>{if(!g.dead&&dist2(player,g)<(player.r+g.r+7)**2){g.dead=true;player.xp+=g.value;burst(g.x,g.y,'#a7ff63',7,105);if(player.xp>=player.need){player.xp-=player.need;player.need=Math.round(player.need*1.35);player.level++;showUpgrade();}}});
  bullets=bullets.filter(b=>!b.dead&&b.y>-40&&b.x>-30&&b.x<W+30);enemies=enemies.filter(e=>!e.dead&&e.y<H+90);enemyShots=enemyShots.filter(s=>!s.dead&&s.life>0&&s.x>-50&&s.x<W+50&&s.y>-80&&s.y<H+80);lasers=lasers.filter(l=>!l.source.dead&&l.age<l.warn+l.active);gems=gems.filter(g=>!g.dead&&g.y<H+30);particles=particles.filter(p=>p.life>0);
}

function updateHud(){if(!player)return;hud.hp.style.width=`${Math.max(0,player.hp/player.maxHp)*100}%`;hud.level.textContent=`LV. ${player.level}`;hud.score.textContent=score.toString().padStart(5,'0');hud.wave.textContent=`WAVE ${wave}`;}

const upgrades=[['화염 연사','발사 간격 18% 감소',()=>player.fire=Math.max(.085,player.fire*.82)],['용의 심장','공격력 +35%',()=>player.damage*=1.35],['갈라지는 불꽃','동시 발사 +1',()=>player.multishot=Math.min(5,player.multishot+1)],['바람의 날개','이동 속도 +16%',()=>player.speed*=1.16],['고대의 비늘','최대 체력 +25',()=>{player.maxHp+=25;player.hp=Math.min(player.maxHp,player.hp+25)}],['재생의 숨결','체력 45 회복',()=>player.hp=Math.min(player.maxHp,player.hp+45)],['새끼 드래곤',()=>player.wingmanLevel===0?'LV.1 좌측 윙맨 소환':'LV.2 우측 윙맨 추가',()=>{player.wingmanLevel=Math.min(2,player.wingmanLevel+1);player.wingShot=.1},()=>player.wingmanLevel<2]];
function showUpgrade(){
  state='upgrade';ui.upgrade.classList.add('visible');ui.cards.innerHTML='';
  const available=upgrades.filter(u=>!u[3]||u[3]()),wingman=available.find(u=>u[0]==='새끼 드래곤');
  const others=available.filter(u=>u!==wingman).sort(()=>Math.random()-.5);
  const choices=wingman?[wingman,...others.slice(0,2)]:others.slice(0,3);
  choices.forEach(([name,desc,apply])=>{const description=typeof desc==='function'?desc():desc,b=document.createElement('button');b.innerHTML=`<strong>${name}</strong><span>${description}</span>`;b.onclick=()=>{apply();ui.upgrade.classList.remove('visible');state='play';};ui.cards.appendChild(b);});
}
function endGame(){state='over';ui.result.textContent=`생존 ${Math.floor(time)}초 · 점수 ${score} · 웨이브 ${wave}`;ui.over.classList.add('visible');diveButton.classList.remove('visible');hud.root.classList.remove('visible');}

function updateDiveButton(){
  if(!player)return;
  diveButton.classList.toggle('diving',player.diving);
  diveButton.classList.toggle('cooldown',!player.diving&&player.diveCooldown>0);
  const icon=diveButton.querySelector('.flight-icon'),label=diveButton.querySelector('.flight-label');
  if(player.diving){
    const ratio=player.diveTime/3;
    icon.textContent='▼';label.textContent=`하강 중\n${player.diveTime.toFixed(1)}초`;
    diveButton.style.background=`conic-gradient(#31d5ff ${ratio*360}deg,#145985 0deg)`;
    diveButton.setAttribute('aria-disabled','true');
  }else if(player.diveCooldown>0){
    const ratio=1-player.diveCooldown/2;
    icon.textContent='◷';label.textContent=`쿨타임\n${player.diveCooldown.toFixed(1)}초`;
    diveButton.style.background=`conic-gradient(#7d9aa6 ${ratio*360}deg,#354a53 0deg)`;
    diveButton.setAttribute('aria-disabled','true');
  }else{
    icon.textContent='▼';label.textContent='하강';
    diveButton.style.background='linear-gradient(#baff74,#72d53e)';
    diveButton.setAttribute('aria-disabled','false');
  }
}
function toggleDive(){
  if(state!=='play'||!player||player.diving||player.diveCooldown>0)return;
  player.diving=true;
  player.diveTime=3;
  player.shot=player.fire*.6;
  burst(player.x,player.y,'#68d8ff',9,90);
  updateDiveButton();
}

function drawSprite(img,frame,x,y,size,rotation=0,alpha=1){if(!img.complete)return;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(rotation);ctx.drawImage(img,frame*256,0,256,256,-size/2,-size/2,size,size);ctx.restore();}
function drawBackground(){if(art.bg.complete&&art.bg.naturalWidth){const tileHeight=Math.ceil(W*art.bg.naturalHeight/art.bg.naturalWidth);ctx.drawImage(art.bg,0,bgY-tileHeight,W,tileHeight+1);ctx.drawImage(art.bg,0,bgY-1,W,tileHeight+1);}else{ctx.fillStyle='#18b9d2';ctx.fillRect(0,0,W,H);}ctx.fillStyle='#7cecff12';ctx.fillRect(0,0,W,H);}
function drawPlayerCharacter(){
  const pphase=time*10,pframe=Math.floor(pphase)%12,pbob=Math.sin(pphase*Math.PI/6)*1.2;
  if(art.shadow.complete){
    const shadowWidth=74*player.altitude,shadowHeight=37*player.altitude;
    ctx.save();
    ctx.globalAlpha=.48+(1-player.altitude)*.25;
    ctx.drawImage(art.shadow,player.x-shadowWidth/2,player.y+pbob+6-shadowHeight/2,shadowWidth,shadowHeight);
    ctx.restore();
  }
  if(player.wingmanLevel>0){
    const wingSize=68*player.altitude,wingY=player.y+pbob+12;
    drawSprite(art.player,(pframe+2)%12,player.x-58*player.altitude,wingY,wingSize,-.06,player.inv>0&&Math.floor(player.inv*14)%2===0?.45:1);
    if(player.wingmanLevel>1)drawSprite(art.player,(pframe+8)%12,player.x+58*player.altitude,wingY,wingSize,.06,player.inv>0&&Math.floor(player.inv*14)%2===0?.45:1);
  }
  drawSprite(art.player,pframe,player.x,player.y+pbob,154*player.altitude,0,player.inv>0&&Math.floor(player.inv*14)%2===0?.45:1);
}
function drawPlayerHealthBar(){
  const width=94,height=13,x=player.x-width/2,y=player.y-70*player.altitude;
  const ratio=Math.max(0,player.hp/player.maxHp);
  ctx.save();
  ctx.fillStyle='#14242bd9';ctx.strokeStyle='#f5fff0';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(x-3,y-3,width+6,height+6,8);ctx.fill();ctx.stroke();
  ctx.fillStyle='#33484f';ctx.beginPath();ctx.roundRect(x,y,width,height,5);ctx.fill();
  if(ratio>0){ctx.fillStyle=ratio<.3?'#ff5261':'#73ec3e';ctx.beginPath();ctx.roundRect(x,y,width*ratio,height,5);ctx.fill();ctx.fillStyle='#dfffba';ctx.globalAlpha=.7;ctx.fillRect(x+5,y+2,Math.max(0,width*ratio-10),3);}
  ctx.globalAlpha=1;ctx.fillStyle='white';ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowBlur=3;ctx.shadowColor='#000';ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`,player.x,y+height/2+.5);ctx.restore();
}
function draw(){
  ctx.clearRect(0,0,W,H);drawBackground();if(!player)return;
  gems.forEach(g=>{ctx.fillStyle='#a8ff62';ctx.shadowBlur=14;ctx.shadowColor='#54ff74';ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fffbc0';ctx.beginPath();ctx.arc(g.x-2,g.y-2,3,0,Math.PI*2);ctx.fill();});ctx.shadowBlur=0;
  const playerBelowAirLayer=player.diving||player.altitude<.9;
  if(playerBelowAirLayer)drawPlayerCharacter();
  bullets.forEach(b=>{const grad=ctx.createLinearGradient(b.x,b.y+14,b.x,b.y-15);grad.addColorStop(0,'#ff7b1a');grad.addColorStop(.45,'#ffd544');grad.addColorStop(1,'#fffbd0');ctx.fillStyle=grad;ctx.shadowBlur=16;ctx.shadowColor='#ff8c27';ctx.beginPath();ctx.moveTo(b.x,b.y-16);ctx.lineTo(b.x+7,b.y+9);ctx.lineTo(b.x,b.y+5);ctx.lineTo(b.x-7,b.y+9);ctx.closePath();ctx.fill();});ctx.shadowBlur=0;
  lasers.forEach(l=>{const x2=l.x+l.dx*1200,y2=l.y+l.dy*1200,isActive=l.age>=l.warn;ctx.save();ctx.lineCap='round';if(isActive){ctx.globalAlpha=1;ctx.strokeStyle='#fff6d0';ctx.shadowBlur=22;ctx.shadowColor='#ff342d';ctx.lineWidth=15;ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(x2,y2);ctx.stroke();ctx.strokeStyle='#ff3b31';ctx.lineWidth=7;ctx.stroke();}else{const pulse=.35+.35*Math.sin(l.age*28);ctx.globalAlpha=.48+pulse;ctx.setLineDash([14,10]);ctx.strokeStyle='#ff534b';ctx.lineWidth=3+pulse*2;ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(x2,y2);ctx.stroke();}ctx.restore();});
  enemies.forEach(e=>{const frame=Math.floor(e.anim)%12,size=e.heavy?192:108,bob=Math.sin(e.anim*Math.PI/6)*1.2,aiming=lasers.some(l=>l.source===e),flightTilt=aiming?0:Math.sin(time*2+e.phase)*.018;drawSprite(art.enemy,frame,e.x,e.y+bob,size,e.rotation+flightTilt);if(e.heavy){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.rotation);ctx.fillStyle='#27333ccc';ctx.fillRect(-45,-68,90,7);ctx.fillStyle='#ffcf4e';ctx.fillRect(-45,-68,90*e.hp/e.max,7);ctx.restore();}});
  enemyShots.forEach(s=>{ctx.save();ctx.translate(s.x,s.y);ctx.shadowBlur=s.type==='orb'?18:12;ctx.shadowColor=s.type==='orb'?'#ff43ec':'#913cff';const g=ctx.createRadialGradient(-2,-2,1,0,0,s.r+4);g.addColorStop(0,'#fff');g.addColorStop(.28,s.type==='orb'?'#ff8df5':'#d58cff');g.addColorStop(1,s.type==='orb'?'#d31acb':'#6224d8');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,s.r,0,Math.PI*2);ctx.fill();ctx.restore();});
  particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,3.2,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;
  if(!playerBelowAirLayer)drawPlayerCharacter();
  drawPlayerHealthBar();
  updateHud();
  if(waveBanner>0){const fade=Math.min(1,waveBanner/.45,(2.4-waveBanner)/.35);ctx.save();ctx.globalAlpha=Math.max(0,fade);ctx.textAlign='center';ctx.fillStyle='#09293bc9';ctx.roundRect(W/2-112,105,224,72,20);ctx.fill();ctx.strokeStyle='#c9ff7c';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.shadowBlur=14;ctx.shadowColor='#69eaff';ctx.font='900 34px system-ui';ctx.fillText(`WAVE ${wave}`,W/2,151);ctx.restore();}
}

function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop);}requestAnimationFrame(loop);
document.querySelector('#titleStart').onclick=()=>{state='lobby';ui.title.classList.remove('visible');ui.lobby.classList.add('visible');};
document.querySelector('#lobbyPlay').onclick=reset;
document.querySelector('#restart').onclick=reset;
document.querySelector('#backLobby').onclick=()=>{state='lobby';ui.over.classList.remove('visible');ui.lobby.classList.add('visible');hud.root.classList.remove('visible');diveButton.classList.remove('visible');};
document.querySelector('#pause').onclick=()=>{if(state==='play'){state='paused';ui.pause.classList.add('visible');diveButton.classList.remove('visible');}};
document.querySelector('#resume').onclick=()=>{if(state==='paused'){state='play';ui.pause.classList.remove('visible');diveButton.classList.add('visible');last=performance.now();}};
diveButton.addEventListener('pointerdown',e=>e.stopPropagation());
diveButton.addEventListener('click',toggleDive);
addEventListener('keydown',e=>keys.add(e.code));addEventListener('keyup',e=>keys.delete(e.code));
function point(e){const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)*W/r.width;pointer.y=(e.clientY-r.top)*H/r.height;}
canvas.addEventListener('pointerdown',e=>{pointer.active=true;point(e)});canvas.addEventListener('pointermove',e=>{if(pointer.active)point(e)});addEventListener('pointerup',()=>pointer.active=false);
