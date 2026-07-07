applyLocalization();
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const ui = { title: document.querySelector('#titleScreen'), lobby: document.querySelector('#lobbyScreen'), countdown: document.querySelector('#countdown'), countdownNumber: document.querySelector('#countdownNumber'), upgrade: document.querySelector('#upgrade'), reroll: document.querySelector('#reroll'), over: document.querySelector('#gameover'), pause: document.querySelector('#pausePanel'), result: document.querySelector('#result'), cards: document.querySelector('#cards') };
const ultimateButton = document.querySelector('#ultimate');
const hud={root:document.querySelector('#hud'),hp:document.querySelector('#hudHp'),level:document.querySelector('#hudLevel'),score:document.querySelector('#hudScore'),wave:document.querySelector('#hudWave'),progress:document.querySelector('#waveProgress')};

const art = { player: new Image(), ignis: new Image(), lumina: new Image(), voltis: new Image(), venora: new Image(), enemy: new Image(), manta: new Image(), eliteWyvernParts: new Image(), miniBoss: new Image(), chapterBoss: new Image(), bg: new Image(), shadow: new Image() };
art.player.src = 'assets/sprites/dragon-red.png';
art.ignis.src = 'assets/sprites/dragon-ignis.png';
art.lumina.src = 'assets/sprites/dragon-lumina.png';
art.voltis.src = 'assets/sprites/dragon-voltis.png';
art.venora.src = 'assets/sprites/dragon-venora.png';
art.enemy.src = 'assets/sprites/wyvern-blue.png';
art.manta.src = 'assets/sprites/sky-manta.png';
art.eliteWyvernParts.src = 'assets/sprites/elite-parts-wyvern.png';
art.miniBoss.src = 'assets/sprites/wyvern-crimson-armored.png';
art.chapterBoss.src = 'assets/sprites/emerald-dreadwing-phase2-v7.png';
art.bg.src = matchMedia('(pointer: coarse)').matches ? 'assets/backgrounds/sky-canyon-tall-v3.png' : 'assets/backgrounds/sky-canyon.png';
art.shadow.src = 'assets/sprites/dragon-shadow.png';

let state = 'title', last = 0, time = 0, animationTime = 0, score = 0, wave = 1, spawnClock = 0, bgY = 0, waveBanner = 0, bossBanner = 0, countdownTime = 0, countdownValue = 0;
let player, bullets = [], enemies = [], enemyShots = [], lasers = [], particles = [], fireImpacts = [], lightningEffects = [], damageTexts = [], gems = [], essences = [];
const keys = new Set();
const pointer = { active:false, id:null, baseX:0, baseY:0, knobX:0, knobY:0, dx:0, dy:0, radius:56, deadzone:8 };
const rand = (a,b) => a + Math.random() * (b-a);
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const dist2 = (a,b) => (a.x-b.x)**2 + (a.y-b.y)**2;
const MAX_SKILL_LEVEL = 5;
const WAVE_DURATION = 25;
const MINIBOSS_WAVE_INTERVAL = 3;
const CHAPTER_BOSS_WAVE = 10;
const WAVE_PROGRESS_STEPS=[
  {wave:1,label:'1'},{wave:2,label:'2'},{wave:3,label:'3'},{wave:3,label:'☠',boss:true},
  {wave:4,label:'4'},{wave:5,label:'5'},{wave:6,label:'6'},{wave:6,label:'☠',boss:true},
  {wave:7,label:'7'},{wave:8,label:'8'},{wave:9,label:'9'},{wave:10,label:'☠',boss:true,final:true}
];
const PLAYER_MAX_Y = H * .72;
const TOUCH_SPEED_MULTIPLIER = 1.4;
const characterTypes = {
  default: { ultimate: { maxGauge:100, projectileCount:24, damageMultiplier:5, projectileSpeed:620 } }
};
const babyDragonTypes = {
  ignis: { nameKey:'dragon.ignis.name', skillKey:'dragon.ignis.skill', effectKey:'dragon.ignis.effect', art:'ignis', color:'#ffcf6a' },
  lumina: { nameKey:'dragon.lumina.name', skillKey:'dragon.lumina.skill', effectKey:'dragon.lumina.effect', art:'lumina', color:'#8ef4ff' },
  voltis: { nameKey:'dragon.voltis.name', skillKey:'dragon.voltis.skill', effectKey:'dragon.voltis.effect', art:'voltis', color:'#ffe66a' },
  venora: { nameKey:'dragon.venora.name', skillKey:'dragon.venora.skill', effectKey:'dragon.venora.effect', art:'venora', color:'#9dff5a' }
};
const monsterVisuals = {
  wyvern: { baseArt:'enemy', elitePartsArt:'eliteWyvernParts' },
  manta: { baseArt:'manta' },
  emeraldDreadwing: { baseArt:'chapterBoss' }
};
const wingSlotOffsets=[[-62,-25],[62,-25],[-72,35],[72,35]];
function pointSegmentDistance2(px,py,x1,y1,x2,y2){const vx=x2-x1,vy=y2-y1,wx=px-x1,wy=py-y1,c1=vx*wx+vy*wy;if(c1<=0)return (px-x1)**2+(py-y1)**2;const c2=vx*vx+vy*vy;if(c2<=c1)return (px-x2)**2+(py-y2)**2;const t=c1/c2,qx=x1+t*vx,qy=y1+t*vy;return (px-qx)**2+(py-qy)**2;}
function segmentHitsEllipse(cx,cy,x1,y1,x2,y2,rx,ry){return pointSegmentDistance2(0,0,(x1-cx)/rx,(y1-cy)/ry,(x2-cx)/rx,(y2-cy)/ry)<1;}

function reset() {
  player = { characterId:'default', x:W/2, y:H*.68, r:18, speed:285, hp:100, maxHp:100, fire:.31, shot:0, damage:18, multishot:1, level:1, xp:0, need:35, inv:0, altitude:1, rerolls:2, ultimateGauge:0, ultimateMax:characterTypes.default.ultimate.maxGauge,
    upgradeLevels: { fire:0, damage:0, multishot:0, speed:0, maxHp:0, heal:0 },
    dragonLevels: { ignis:0, lumina:0, voltis:0, venora:0 },
    wingSlots: Array.from({length:4},()=>({type:null,shot:0,shield:0,cooldown:0,rotation:0,targetRotation:0}))
  };
  bullets=[]; enemies=[]; enemyShots=[]; lasers=[]; particles=[]; fireImpacts=[]; lightningEffects=[]; damageTexts=[]; gems=[]; essences=[]; time=animationTime=score=spawnClock=bgY=0; wave=1; waveBanner=2.4; bossBanner=0; countdownTime=3; countdownValue=3; state='countdown';pointer.active=false;pointer.id=null;pointer.dx=pointer.dy=0;
  [ui.title,ui.lobby,ui.upgrade,ui.over,ui.pause].forEach(x=>x.classList.remove('visible'));
  hud.root.classList.add('visible');
  ultimateButton.classList.remove('visible');
  ui.countdownNumber.textContent='3';
  ui.countdown.classList.add('visible');
  updateUltimateButton();
}

function spawnEnemy() {
  const eliteChance=wave===1?0:wave===2?.05:Math.min(.1+(wave-3)*.03,.28);
  const tough=1+time/55,elite=Math.random()<eliteChance,type=elite?'elite':'normal';
  const pattern=elite?(Math.random()<.5?'enhancedOrb':'laser'):'orb';
  enemies.push({x:rand(55,W-55),y:-75,r:elite?26:18,hp:(elite?95:30)*tough,max:(elite?95:30)*tough,speed:rand(62,96)*(elite?.78:1)*(1+time/240),sway:rand(1.2,3.4),phase:rand(0,7),damage:elite?26:14,type,monsterId:'wyvern',elite,anim:rand(0,12),attack:rand(1.1,2.4),pattern,rotation:0,targetRotation:0});
}

function spawnMiniBoss(){
  const scale=1+(wave-3)*.16,tough=1+time/70,hp=420*scale*tough;
  enemies.push({x:W/2,y:-130,r:44,hp,max:hp,speed:42*(1+time/360),sway:1.15,phase:rand(0,7),damage:36+wave*1.5,type:'miniboss',boss:true,anim:0,attack:1.4,pattern:'bossLaser',rotation:0,targetRotation:0,anchorY:155,patrolDir:Math.random()<.5?-1:1});
  bossBanner=2.2;spawnClock=Math.max(spawnClock,2.8);
}
function spawnChampion(){
  const tough=1+time/65,hp=220*tough;
  enemies.push({x:rand(105,W-105),y:-115,r:34,hp,max:hp,speed:52,sway:.9,phase:rand(0,7),damage:32,type:'champion',monsterId:'manta',champion:true,anim:rand(0,12),attack:1.25,pattern:'enhancedOrb',rotation:0,targetRotation:0,anchorY:230,patrolDir:Math.random()<.5?-1:1});
}
function spawnChapterBoss(){
  const tough=1+time/90,hp=1800*tough;
  enemies=[];enemyShots=[];lasers=[];
  enemies.push({x:W/2,y:-170,r:58,hp,max:hp,speed:38,sway:.8,phase:rand(0,7),damage:48,type:'chapterBoss',monsterId:'emeraldDreadwing',boss:true,chapterBoss:true,anim:0,attack:1.8,pattern:'chapterEnergy',rotation:0,targetRotation:0,anchorY:185,patrolDir:1});
  bossBanner=3;spawnClock=999;
}

function enemyAttack(e){
  if(e.pattern==='chapterEnergy'){
    const base=Math.atan2(player.y-e.y,player.x-e.x);e.attackMode=(e.attackMode||0)+1;
    if(e.attackMode%2===1){
      const count=e.hp/e.max<.5?5:3,speed=230;
      for(let i=0;i<count;i++){const offset=(i-(count-1)/2)*.2,a=base+offset;enemyShots.push({type:'chapterEnergy',x:e.x,y:e.y+35,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:16,life:7,damage:26,age:0});}
      e.attack=e.hp/e.max<.5?1.45:1.8;
    }else{
      for(const side of [-1,1]){const speed=92,life=5.7;enemyShots.push({type:'chapterHoming',source:e,side,x:e.x+side*104,y:e.y+32,vx:0,vy:0,speed,turn:1.25,r:19,life,maxLife:life,charge:.9,damage:32,age:0,homing:true});}
      e.attack=e.hp/e.max<.5?2.1:2.55;
    }
    return;
  }else if(e.pattern==='bossLaser'){
    const base=Math.atan2(player.y-e.y,player.x-e.x),count=wave>=6?3:1;
    for(let i=0;i<count;i++){const offset=(i-(count-1)/2)*.2,a=base+offset;lasers.push({source:e,x:e.x,y:e.y,dx:Math.cos(a),dy:Math.sin(a),age:0,warn:1.15,active:.65,damage:30+wave*2,boss:true});}
    e.targetRotation=base-Math.PI/2;e.attack=rand(3.6,4.5);return;
  }else if(e.pattern==='enhancedOrb'){
    const a=Math.atan2(player.y-e.y,player.x-e.x),speed=235+wave*5;
    enemyShots.push({type:'enhancedOrb',x:e.x,y:e.y+18,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:11,life:6,damage:19});
  }else if(e.pattern==='orb'){
    const a=Math.atan2(player.y-e.y,player.x-e.x),speed=205+wave*4;
    enemyShots.push({type:'orb',x:e.x,y:e.y+18,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:8,life:6,damage:13});
  }else if(e.pattern==='burst'){
    const count=e.elite?12:8,offset=time*.8;
    for(let i=0;i<count;i++){const a=offset+i*Math.PI*2/count,speed=e.elite?155:135;enemyShots.push({type:'burst',x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:6,life:5,damage:10});}
  }else{
    const a=Math.atan2(player.y-e.y,player.x-e.x);
    e.targetRotation=a-Math.PI/2;
    lasers.push({source:e,x:e.x,y:e.y,dx:Math.cos(a),dy:Math.sin(a),age:0,warn:.85,active:.42,damage:24});
  }
  e.attack=rand(e.elite?2.2:2.8,e.elite?3.4:4.4);
}

function fire(){
  for(let i=0;i<player.multishot;i++){const a=(i-(player.multishot-1)/2)*.13;bullets.push({x:player.x,y:player.y-48,vx:Math.sin(a)*520,vy:-Math.cos(a)*720,r:5,damage:player.damage});}
  burst(player.x,player.y-44,'#fff19a',3,75);
}
function wingPosition(index){const [ox,oy]=wingSlotOffsets[index];return {x:player.x+ox*player.altitude,y:player.y+oy*player.altitude};}
function nearestEnemy(position){return enemies.filter(e=>!e.dead).sort((a,b)=>dist2(position,a)-dist2(position,b))[0]||null;}
function showDamage(x,y,amount){damageTexts.push({x:x+rand(-6,6),y:y-8,amount:Math.max(1,Math.round(amount)),life:.72,max:.72});}
function showHeal(x,y,amount){damageTexts.push({x:x+rand(-4,4),y:y-18,amount:Math.max(1,Math.round(amount)),type:'heal',life:1,max:1});}
function defeatEnemy(e){if(e.dead)return;e.dead=true;score+=e.chapterBoss?1000:e.boss?250:e.champion?100:e.elite?35:10;gems.push({x:e.x,y:e.y,r:e.boss?12:e.champion?10:8,value:e.chapterBoss?100:e.boss?45:e.champion?25:e.elite?12:5});if(e.boss||e.champion)essences.push({x:e.x,y:e.y,r:e.boss?13:10,value:e.chapterBoss?50:e.boss?30:12,refined:!!e.boss});else if(Math.random()<.2)essences.push({x:e.x,y:e.y,r:9,value:5,refined:false});burst(e.x,e.y,e.chapterBoss?'#b864ff':e.boss?'#fff36b':e.champion?'#55ddff':e.elite?'#ffb347':'#9c73ff',e.boss?34:e.champion?24:16,e.boss?340:e.champion?280:230);if(e.chapterBoss)completeChapter();}
function fireIgnis(index,wing){
  const level=player.dragonLevels.ignis,pos=wingPosition(index),target=nearestEnemy(pos),angle=target?Math.atan2(target.y-pos.y,target.x-pos.x):wing.rotation-Math.PI/2,speed=650;
  const damageRatio=.48*(1+(level-1)*.22);
  bullets.push({x:pos.x,y:pos.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:5+level*.55,damage:player.damage*damageRatio,wingman:true,wingmanType:'ignis',skillLevel:level,pierce:2,hitEnemies:new Set()});
  wing.shot=.58*Math.pow(.94,level-1);
}
function fireVoltis(index,wing){
  const level=player.dragonLevels.voltis,pos=wingPosition(index),maxTargets=2+Math.floor((level-1)/2),hit=[],points=[pos];
  let origin=pos;
  for(let i=0;i<maxTargets;i++){const target=enemies.filter(e=>!e.dead&&!hit.includes(e)).sort((a,b)=>dist2(origin,a)-dist2(origin,b))[0];if(!target||Math.sqrt(dist2(origin,target))>260)break;hit.push(target);points.push({x:target.x,y:target.y});const damage=player.damage*(.55+(level-1)*.12)*Math.pow(.88,i);target.hp-=damage;target.hitFlash=.11;showDamage(target.x,target.y,damage);if(target.hp<=0)defeatEnemy(target);origin=target;}
  if(points.length>1){lightningEffects.push({points,level,life:.48,max:.48});burst(points[1].x,points[1].y,'#fff36b',8,135);wing.shot=1.35*Math.pow(.94,level-1);}else wing.shot=.25;
}
function fireVenora(index,wing){
  const level=player.dragonLevels.venora,pos=wingPosition(index),target=nearestEnemy(pos);
  if(!target){wing.shot=.25;return;}
  const angle=Math.atan2(target.y-pos.y,target.x-pos.x),speed=430;
  bullets.push({x:pos.x,y:pos.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:7+level*.65,damage:player.damage*(.22+level*.06),wingman:true,wingmanType:'venora',skillLevel:level,poisonDps:player.damage*(.18+(level-1)*.06),poisonDuration:3+(level-1)*.4});
  wing.shot=1.05*Math.pow(.95,level-1);
}
function burst(x,y,color,n=8,speed=140){for(let i=0;i<n;i++){const a=rand(0,Math.PI*2),v=rand(speed*.35,speed);particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.2,.58),max:.58,color});}}
function ignisImpact(x,y){fireImpacts.push({x,y,life:.28,max:.28});burst(x,y,'#ff5a13',9,170);burst(x,y,'#ffe56b',5,105);}

function damagePlayer(amount,invTime,color){
  const guardian=player.wingSlots.find(wing=>wing.type==='lumina'&&wing.shield>0);
  if(guardian){
    guardian.shield=0;guardian.cooldown=8-(player.dragonLevels.lumina-1)*.8;player.inv=.3;
    burst(player.x,player.y,'#75efff',24,260);
    return false;
  }
  player.hp-=amount;player.inv=invTime;player.hitFlash=.12;burst(player.x,player.y,color,18,240);
  showDamage(player.x,player.y,amount);
  if(player.hp<=0){endGame();return true;}
  return false;
}

function gainUltimateGauge(amount){player.ultimateGauge=Math.min(player.ultimateMax,player.ultimateGauge+amount);updateUltimateButton();}
function updateUltimateButton(){
  if(!player)return;
  const ratio=clamp(player.ultimateGauge/player.ultimateMax,0,1),percent=Math.round(ratio*100),label=ultimateButton.querySelector('.ultimate-label');
  label.textContent=t('ultimate.label',{percent});
  ultimateButton.style.background=`conic-gradient(#ffd84a ${ratio*360}deg,#354a53 0deg)`;
  ultimateButton.classList.toggle('ready',ratio>=1);
  ultimateButton.disabled=state!=='play'||ratio<1;
  ultimateButton.setAttribute('aria-label',t('aria.ultimate',{current:Math.round(player.ultimateGauge),max:player.ultimateMax}));
}
function useUltimate(){
  if(state!=='play'||player.ultimateGauge<player.ultimateMax)return;
  const config=characterTypes[player.characterId].ultimate;
  for(let i=0;i<config.projectileCount;i++){const angle=i*Math.PI*2/config.projectileCount;bullets.push({x:player.x,y:player.y,vx:Math.cos(angle)*config.projectileSpeed,vy:Math.sin(angle)*config.projectileSpeed,r:8,damage:player.damage*config.damageMultiplier,wingman:true,wingmanType:'ultimate',skillLevel:1});}
  player.ultimateGauge=0;burst(player.x,player.y,'#fff27a',42,360);updateUltimateButton();
}

function updatePlayerMovement(dt){
  let dx=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0),dy=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);
  if(pointer.active){dx=pointer.dx;dy=pointer.dy;}
  const len=Math.hypot(dx,dy)||1;
  const speed=player.speed*(pointer.active?TOUCH_SPEED_MULTIPLIER:1);
  if(Math.abs(dx)+Math.abs(dy)>0){player.x+=dx/Math.max(1,len)*speed*dt;player.y+=dy/Math.max(1,len)*speed*dt;}
  player.x=clamp(player.x,38,W-38);player.y=clamp(player.y,105,PLAYER_MAX_Y);
}

function update(dt){
  if(state==='countdown'){
    animationTime+=dt;
    const bgTileHeight=art.bg.complete&&art.bg.naturalWidth?W*art.bg.naturalHeight/art.bg.naturalWidth:H*2;
    bgY=(bgY+52*dt)%bgTileHeight;
    updatePlayerMovement(dt);
    countdownTime=Math.max(0,countdownTime-dt);
    const nextValue=Math.max(1,Math.ceil(countdownTime));
    if(nextValue!==countdownValue){
      countdownValue=nextValue;
      ui.countdownNumber.textContent=String(nextValue);
      ui.countdownNumber.style.animation='none';
      void ui.countdownNumber.offsetWidth;
      ui.countdownNumber.style.animation='';
    }
    if(countdownTime<=0){
      state='play';
      ui.countdown.classList.remove('visible');
      ultimateButton.classList.add('visible');
      last=performance.now();
    }
    return;
  }
  if(state!=='play')return;
  animationTime+=dt;
  const bgTileHeight=art.bg.complete&&art.bg.naturalWidth?W*art.bg.naturalHeight/art.bg.naturalWidth:H*2;
  time+=dt;
  const nextWave=Math.min(CHAPTER_BOSS_WAVE,1+Math.floor(time/WAVE_DURATION));
  if(nextWave!==wave){wave=nextWave;waveBanner=2.4;burst(W/2,145,'#fff0a0',24,180);if(wave===CHAPTER_BOSS_WAVE)spawnChapterBoss();else{if(wave%MINIBOSS_WAVE_INTERVAL===0)spawnMiniBoss();if(wave%3===2)spawnChampion();}}
  waveBanner=Math.max(0,waveBanner-dt);
  bossBanner=Math.max(0,bossBanner-dt);
  bgY=(bgY+52*dt)%bgTileHeight; player.inv-=dt;player.hitFlash=Math.max(0,(player.hitFlash||0)-dt);
  updateUltimateButton();
  updatePlayerMovement(dt);
  player.shot-=dt;
  player.wingSlots.forEach((wing,index)=>{
    wing.shot-=dt;
    if(wing.type){const target=nearestEnemy(wingPosition(index));wing.targetRotation=target?Math.atan2(target.y-wingPosition(index).y,target.x-wingPosition(index).x)+Math.PI/2:0;const turnDelta=Math.atan2(Math.sin(wing.targetRotation-wing.rotation),Math.cos(wing.targetRotation-wing.rotation));wing.rotation+=turnDelta*Math.min(1,dt*10);}
    if(wing.type==='lumina'&&wing.shield<=0){wing.cooldown=Math.max(0,wing.cooldown-dt);if(wing.cooldown<=0){wing.shield=1;burst(player.x,player.y,'#75efff',14,130);}}
  });
  if(player.shot<=0){fire();player.shot=player.fire;}
  player.wingSlots.forEach((wing,index)=>{if(wing.shot>0)return;if(wing.type==='ignis')fireIgnis(index,wing);else if(wing.type==='voltis')fireVoltis(index,wing);else if(wing.type==='venora')fireVenora(index,wing);});
  spawnClock-=dt;if(wave<CHAPTER_BOSS_WAVE&&spawnClock<=0){spawnEnemy();spawnClock=Math.max(.55,1.22-time/260);}
  bullets.forEach(b=>{b.prevX=b.x;b.prevY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.age=(b.age||0)+dt;});
  enemies.forEach(e=>{
    e.hitFlash=Math.max(0,(e.hitFlash||0)-dt);
    if(e.boss){
      if(e.y<e.anchorY)e.y=Math.min(e.anchorY,e.y+e.speed*dt);
      else{
        const hoverRange=e.chapterBoss?10:34,hoverSpeed=e.chapterBoss?0.55:0.9;
        const patrolSpeed=72+wave*2,targetY=e.anchorY+Math.sin(time*hoverSpeed+e.phase)*hoverRange;
        e.x+=e.patrolDir*patrolSpeed*dt;e.y+=(targetY-e.y)*Math.min(1,dt*2.2);
        const edge=e.chapterBoss?158:82;
        if(e.x<edge){e.x=edge;e.patrolDir=1;}else if(e.x>W-edge){e.x=W-edge;e.patrolDir=-1;}
      }
    }else if(e.champion){
      if(e.y<e.anchorY)e.y=Math.min(e.anchorY,e.y+e.speed*dt);
      else{const patrolSpeed=88,targetY=e.anchorY+Math.sin(time*1.15+e.phase)*62;e.x+=e.patrolDir*patrolSpeed*dt;e.y+=(targetY-e.y)*Math.min(1,dt*2.4);if(e.x<78){e.x=78;e.patrolDir=1;}else if(e.x>W-78){e.x=W-78;e.patrolDir=-1;}}
    }else{e.y+=e.speed*dt;e.x+=Math.sin(time*e.sway+e.phase)*32*dt;}
    e.anim+=dt*12;e.attack-=dt;
    if(e.poisonTime>0){e.poisonTime-=dt;e.hp-=e.poisonDps*dt;e.poisonTextClock=(e.poisonTextClock||0)-dt;if(e.poisonTextClock<=0){showDamage(e.x,e.y,e.poisonDps*.5);e.poisonTextClock=.5;}if(Math.random()<dt*8)burst(e.x+rand(-12,12),e.y+rand(-12,12),'#8dff45',1,45);if(e.hp<=0){defeatEnemy(e);return;}}
    const aimingLaser=lasers.some(l=>l.source===e);
    if(!aimingLaser)e.targetRotation=0;
    const turnDelta=Math.atan2(Math.sin(e.targetRotation-e.rotation),Math.cos(e.targetRotation-e.rotation));
    e.rotation+=turnDelta*Math.min(1,dt*(aimingLaser?7:3.2));
    if(e.y>85&&e.y<H*.7&&e.attack<=0)enemyAttack(e);
  });
  enemyShots.forEach(s=>{s.age=(s.age||0)+dt;if(s.homing&&s.charge>0){s.charge-=dt;if(s.source&&!s.source.dead){s.x=s.source.x+s.side*104;s.y=s.source.y+32;}if(s.charge<=0){const launch=Math.atan2(player.y-s.y,player.x-s.x);s.vx=Math.cos(launch)*s.speed;s.vy=Math.sin(launch)*s.speed;burst(s.x,s.y,'#d78aff',18,170);}}else{if(s.homing){const current=Math.atan2(s.vy,s.vx),target=Math.atan2(player.y-s.y,player.x-s.x),delta=Math.atan2(Math.sin(target-current),Math.cos(target-current)),angle=current+delta*Math.min(1,s.turn*dt);s.vx=Math.cos(angle)*s.speed;s.vy=Math.sin(angle)*s.speed;if(Math.random()<dt*18)particles.push({x:s.x+rand(-5,5),y:s.y+rand(-5,5),vx:-s.vx*.12+rand(-20,20),vy:-s.vy*.12+rand(-20,20),life:.32,max:.32,color:'#b94cff'});}s.x+=s.vx*dt;s.y+=s.vy*dt;}s.life-=dt;if(s.homing&&s.life<=0)burst(s.x,s.y,'#b94cff',12,120);});
  lasers.forEach(l=>{l.age+=dt;if(!l.source.dead){l.x=l.source.x;l.y=l.source.y;}});
  particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;});
  fireImpacts.forEach(impact=>impact.life-=dt);
  lightningEffects.forEach(effect=>effect.life-=dt);
  damageTexts.forEach(text=>{text.y-=32*dt;text.life-=dt;});
  gems.forEach(g=>{const d=Math.hypot(player.x-g.x,player.y-g.y);if(d<135){g.x+=(player.x-g.x)*dt*7;g.y+=(player.y-g.y)*dt*7;}else g.y+=38*dt;});
  essences.forEach(item=>{const d=Math.hypot(player.x-item.x,player.y-item.y),range=item.refined?190:150;if(d<range){item.x+=(player.x-item.x)*dt*8;item.y+=(player.y-item.y)*dt*8;}else item.y+=32*dt;});
  for(const b of bullets)for(const e of enemies)if(!b.dead&&!e.dead&&(!b.hitEnemies||!b.hitEnemies.has(e))&&segmentHitsEllipse(e.x,e.y,b.prevX??b.x,b.prevY??b.y,b.x,b.y,e.r*1.55+b.r,e.r*1.12+b.r)){if(b.hitEnemies)b.hitEnemies.add(e);if(b.pierce>0)b.pierce--;else b.dead=true;e.hp-=b.damage;e.hitFlash=.11;showDamage(e.x,e.y,b.damage);if(b.wingmanType==='ignis')ignisImpact(b.x,b.y);else if(b.wingmanType==='venora'){e.poisonTime=Math.max(e.poisonTime||0,b.poisonDuration);e.poisonDps=Math.max(e.poisonDps||0,b.poisonDps);e.poisonTextClock=.5;burst(b.x,b.y,'#91ff3f',12,125);}else burst(b.x,b.y,'#ffd267',4,85);if(e.hp<=0)defeatEnemy(e);}
  for(const e of enemies)if(!e.dead&&dist2(player,e)<(player.r+e.r)**2){if(!e.boss)e.dead=true;if(player.inv<=0&&damagePlayer(e.damage,.75,'#fff'))return;}
  if(player.inv<=0){
    for(const s of enemyShots)if(!s.dead&&dist2(player,s)<(player.r+s.r)**2){s.dead=true;if(damagePlayer(s.damage,.65,'#ff8df3'))return;break;}
    if(player.inv<=0)for(const l of lasers)if(l.age>=l.warn&&l.age<l.warn+l.active){const x2=l.x+l.dx*1200,y2=l.y+l.dy*1200,laserRadius=l.boss?14:9;if(pointSegmentDistance2(player.x,player.y,l.x,l.y,x2,y2)<(player.r+laserRadius)**2){if(damagePlayer(l.damage,.8,'#ff554f'))return;break;}}
  }
  gems.forEach(g=>{if(!g.dead&&dist2(player,g)<(player.r+g.r+7)**2){g.dead=true;player.xp+=g.value;burst(g.x,g.y,'#a7ff63',7,105);if(player.xp>=player.need){player.xp-=player.need;player.need=Math.round(player.need*1.35);player.level++;const beforeHp=player.hp,healAmount=Math.max(1,Math.round(player.maxHp*.1));player.hp=Math.min(player.maxHp,player.hp+healAmount);const recovered=Math.round(player.hp-beforeHp);burst(player.x,player.y,'#55ff79',24,190);if(recovered>0)showHeal(player.x,player.y,recovered);showUpgrade();}}});
  essences.forEach(item=>{if(!item.dead&&dist2(player,item)<(player.r+item.r+9)**2){item.dead=true;gainUltimateGauge(item.value);burst(item.x,item.y,item.refined?'#ffd94a':'#6eefff',item.refined?20:10,item.refined?220:130);}});
  bullets=bullets.filter(b=>!b.dead&&b.y>-40&&b.x>-30&&b.x<W+30);enemies=enemies.filter(e=>!e.dead&&e.y<H+90);enemyShots=enemyShots.filter(s=>!s.dead&&s.life>0&&s.x>-50&&s.x<W+50&&s.y>-80&&s.y<H+80);lasers=lasers.filter(l=>!l.source.dead&&l.age<l.warn+l.active);gems=gems.filter(g=>!g.dead&&g.y<H+30);essences=essences.filter(item=>!item.dead&&item.y<H+40);particles=particles.filter(p=>p.life>0);fireImpacts=fireImpacts.filter(impact=>impact.life>0);lightningEffects=lightningEffects.filter(effect=>effect.life>0);damageTexts=damageTexts.filter(text=>text.life>0);
}

function buildWaveProgress(){if(!hud.progress||hud.progress.dataset.ready)return;WAVE_PROGRESS_STEPS.forEach((step,index)=>{const node=document.createElement('span');node.className=`wave-progress-node${step.boss?' boss':''}${step.final?' final':''}`;node.textContent=step.label;node.dataset.wave=step.wave;node.dataset.kind=step.final?'final':step.boss?'boss':'wave';hud.progress.appendChild(node);if(index<WAVE_PROGRESS_STEPS.length-1){const link=document.createElement('span');link.className='wave-progress-link';hud.progress.appendChild(link);}});hud.progress.dataset.ready='1';}
function updateWaveProgress(){if(!hud.progress)return;buildWaveProgress();const miniBossActive=enemies.some(e=>!e.dead&&e.type==='miniboss'),chapterBossActive=enemies.some(e=>!e.dead&&e.chapterBoss);let lastDoneIndex=-1;const nodes=[...hud.progress.querySelectorAll('.wave-progress-node')];nodes.forEach((node,index)=>{const step=WAVE_PROGRESS_STEPS[index],isMini=step.boss&&!step.final,isFinal=!!step.final;let active=false,complete=false;if(isFinal){active=wave>=CHAPTER_BOSS_WAVE;complete=false;}else if(isMini){active=wave===step.wave&&miniBossActive;complete=wave>step.wave;}else{active=wave===step.wave&&!(wave%MINIBOSS_WAVE_INTERVAL===0&&miniBossActive);complete=wave>step.wave;}node.classList.toggle('active',active);node.classList.toggle('complete',complete);if(active||complete)lastDoneIndex=index;});const links=[...hud.progress.querySelectorAll('.wave-progress-link')];links.forEach((link,index)=>link.classList.toggle('complete',index<lastDoneIndex));}
function updateHud(){if(!player)return;hud.hp.style.width=`${Math.max(0,player.hp/player.maxHp)*100}%`;hud.level.textContent=t('hud.level',{level:player.level});hud.score.textContent=t('hud.score',{score:score.toString().padStart(5,'0')});hud.wave.textContent=t('hud.wave',{wave});updateWaveProgress();}

const baseUpgrades=[
  {key:'fire',nameKey:'upgrade.rapidFire.name',descKey:'upgrade.rapidFire.desc',apply:()=>player.fire=Math.max(.085,player.fire*.82)},
  {key:'damage',nameKey:'upgrade.dragonHeart.name',descKey:'upgrade.dragonHeart.desc',apply:()=>player.damage*=1.35},
  {key:'multishot',nameKey:'upgrade.multishot.name',descKey:'upgrade.multishot.desc',apply:()=>player.multishot+=1},
  {key:'speed',nameKey:'upgrade.speed.name',descKey:'upgrade.speed.desc',apply:()=>player.speed*=1.16},
  {key:'maxHp',nameKey:'upgrade.maxHp.name',descKey:'upgrade.maxHp.desc',apply:()=>{player.maxHp+=25;player.hp=Math.min(player.maxHp,player.hp+25)}},
  {key:'heal',nameKey:'upgrade.heal.name',descKey:'upgrade.heal.desc',apply:()=>player.hp=Math.min(player.maxHp,player.hp+45)}
];
function getUpgradeOptions(){
  const options=baseUpgrades.filter(upgrade=>player.upgradeLevels[upgrade.key]<MAX_SKILL_LEVEL).map(upgrade=>{
    const next=player.upgradeLevels[upgrade.key]+1;
    return {kind:next===1?'new':'current',name:t('upgrade.optionName',{name:t(upgrade.nameKey),level:next}),desc:t('upgrade.optionDescription',{effect:t(upgrade.descKey),max:MAX_SKILL_LEVEL}),apply:()=>{upgrade.apply();player.upgradeLevels[upgrade.key]=next;}};
  });
  for(const [type,dragon] of Object.entries(babyDragonTypes)){
    const level=player.dragonLevels[type];
    if(level>=MAX_SKILL_LEVEL)continue;
    const emptySlot=player.wingSlots.find(wing=>!wing.type);
    if(level===0&&!emptySlot)continue;
    const next=level+1,action=t(level===0?'upgrade.action.place':'upgrade.action.levelUp');
    options.push({kind:level===0?'new':'current',name:t('upgrade.optionName',{name:t(dragon.nameKey),level:next}),desc:t('upgrade.dragonDescription',{action,effect:t(dragon.effectKey),max:MAX_SKILL_LEVEL}),apply:()=>{player.dragonLevels[type]=next;if(level===0){emptySlot.type=type;emptySlot.shot=.1;emptySlot.shield=type==='lumina'?1:0;emptySlot.cooldown=0;}}});
  }
  return options;
}
function randomItem(items){return items.length?items[Math.floor(Math.random()*items.length)]:null;}
function composeUpgradeChoices(previous=[]){
  const available=getUpgradeOptions(),choices=[];
  const addFrom=pool=>{const fresh=pool.filter(option=>!choices.includes(option)&&!previous.includes(option.name));const option=randomItem(fresh.length?fresh:pool.filter(item=>!choices.includes(item)));if(option)choices.push(option);};
  const current=available.filter(option=>option.kind==='current'),novel=available.filter(option=>option.kind==='new');
  if(current.length&&novel.length)addFrom(Math.random()<.5?current:novel);
  else addFrom(current.length?current:novel);
  addFrom(novel);
  while(choices.length<Math.min(3,available.length))addFrom(available);
  return choices;
}
function updateRerollButton(){
  ui.reroll.textContent=t('upgrade.reroll',{count:player.rerolls});
  ui.reroll.setAttribute('aria-label',t('aria.reroll',{count:player.rerolls}));
  ui.reroll.disabled=player.rerolls<=0;
}
function renderUpgradeChoices(previous=[]){
  ui.cards.innerHTML='';
  const choices=composeUpgradeChoices(previous);
  if(!choices.length){ui.upgrade.classList.remove('visible');state='play';return;}
  choices.forEach(({name,desc,apply})=>{const b=document.createElement('button');b.innerHTML=`<strong>${name}</strong><span>${desc}</span>`;b.onclick=()=>{apply();ui.upgrade.classList.remove('visible');state='play';};ui.cards.appendChild(b);});
  ui.reroll.dataset.choices=JSON.stringify(choices.map(option=>option.name));
  updateRerollButton();
}
function showUpgrade(){
  releaseVirtualJoystick();state='upgrade';ui.upgrade.classList.add('visible');renderUpgradeChoices();
}
function setResultMode(clear){ui.over.querySelector('[data-i18n="result.eyebrow"]').textContent=t(clear?'result.clearEyebrow':'result.eyebrow');ui.over.querySelector('[data-i18n="result.title"]').textContent=t(clear?'result.clearTitle':'result.title');}
function completeChapter(){releaseVirtualJoystick();state='over';setResultMode(true);ui.result.textContent=t('result.clearSummary',{score});ui.over.classList.add('visible');ultimateButton.classList.remove('visible');hud.root.classList.remove('visible');}
function endGame(){releaseVirtualJoystick();state='over';setResultMode(false);ui.result.textContent=t('result.summary',{seconds:Math.floor(time),score,wave});ui.over.classList.add('visible');ultimateButton.classList.remove('visible');hud.root.classList.remove('visible');}
function jumpToChapterBoss(){releaseVirtualJoystick();enemies=[];bullets=[];enemyShots=[];lasers=[];particles=[];gems=[];essences=[];player.hp=player.maxHp;player.ultimateGauge=player.ultimateMax;time=(CHAPTER_BOSS_WAVE-1)*WAVE_DURATION;wave=CHAPTER_BOSS_WAVE;waveBanner=2.4;spawnChapterBoss();state='play';ui.pause.classList.remove('visible');ultimateButton.classList.add('visible');hud.root.classList.add('visible');updateUltimateButton();last=performance.now();}

function drawSprite(img,frame,x,y,size,rotation=0,alpha=1,hitFlash=0,scaleX=1,scaleY=1){if(!img.complete)return;const width=size*scaleX,height=size*scaleY;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(rotation);ctx.drawImage(img,frame*256,0,256,256,-width/2,-height/2,width,height);if(hitFlash>0){ctx.filter='brightness(0) invert(1)';ctx.globalAlpha=Math.min(.9,hitFlash*8)*alpha;ctx.drawImage(img,frame*256,0,256,256,-width/2,-height/2,width,height);}ctx.restore();}
function drawChapterBossAura(x,y,size,phase){const pulse=.96+Math.sin(animationTime*2.4+phase)*.04;ctx.save();ctx.translate(x,y);ctx.globalCompositeOperation='lighter';ctx.scale(1,.72);const glow=ctx.createRadialGradient(0,0,size*.08,0,0,size*.43);glow.addColorStop(0,'#d8a0ff55');glow.addColorStop(.48,'#8d32e833');glow.addColorStop(1,'#4d0b9b00');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,size*.43*pulse,0,Math.PI*2);ctx.fill();ctx.scale(1,1/.72);ctx.fillStyle='#e8b6ff';for(let i=0;i<6;i++){const a=animationTime*(.7+i%2*.18)+i*Math.PI/3+phase,r=size*(.28+(i%3)*.035),spark=2+Math.sin(animationTime*4+i)*.8;ctx.globalAlpha=.55+.3*Math.sin(animationTime*3+i);ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r*.72,spark,0,Math.PI*2);ctx.fill();}ctx.restore();}
function drawMonsterVisual(e,frame,y,size,rotation){if(e.chapterBoss){const breath=Math.sin(e.anim*Math.PI/6+Math.PI*.35),scaleX=1+breath*.006,scaleY=1-breath*.004;drawChapterBossAura(e.x,y,size,e.phase);drawSprite(art.chapterBoss,frame,e.x,y,size,rotation,1,e.hitFlash||0,scaleX,scaleY);return;}if(e.boss){drawSprite(art.miniBoss,frame,e.x,y,size,rotation,1,e.hitFlash||0);return;}const visual=monsterVisuals[e.monsterId]||monsterVisuals.wyvern;drawSprite(art[visual.baseArt],frame,e.x,y,size,rotation,1,e.hitFlash||0);if(e.elite&&visual.elitePartsArt)drawSprite(art[visual.elitePartsArt],frame,e.x,y,size,rotation,1,e.hitFlash||0);}
function drawBackground(){if(art.bg.complete&&art.bg.naturalWidth){const tileHeight=Math.ceil(W*art.bg.naturalHeight/art.bg.naturalWidth);for(let y=bgY-tileHeight;y<H;y+=tileHeight)ctx.drawImage(art.bg,0,y,W,tileHeight+1);}else{ctx.fillStyle='#18b9d2';ctx.fillRect(0,0,W,H);}ctx.fillStyle='#7cecff12';ctx.fillRect(0,0,W,H);}
function drawPlayerCharacter(){
  const pphase=animationTime*10,pframe=Math.floor(pphase)%12,pbob=Math.sin(pphase*Math.PI/6)*1.2;
  if(art.shadow.complete){
    const shadowWidth=74*player.altitude,shadowHeight=37*player.altitude;
    ctx.save();
    ctx.globalAlpha=.48+(1-player.altitude)*.25;
    ctx.drawImage(art.shadow,player.x-shadowWidth/2,player.y+pbob+6-shadowHeight/2,shadowWidth,shadowHeight);
    ctx.restore();
  }
  if(player.wingSlots.some(wing=>wing.type)){
    ctx.save();ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.shadowBlur=4;ctx.shadowColor='#001d2c';
    player.wingSlots.forEach((wing,index)=>{if(!wing.type)return;const [ox,oy]=wingSlotOffsets[index],dragon=babyDragonTypes[wing.type],level=player.dragonLevels[wing.type],wingSize=(52+level*4)*player.altitude,wingX=player.x+ox*player.altitude,wingY=player.y+oy*player.altitude+pbob;if(level>=3){ctx.save();ctx.globalAlpha=.18+(level-3)*.07;ctx.fillStyle=dragon.color;ctx.shadowBlur=18+level*3;ctx.shadowColor=dragon.color;ctx.beginPath();ctx.arc(wingX,wingY,wingSize*.43,0,Math.PI*2);ctx.fill();if(level===5)for(let spark=0;spark<2;spark++){const angle=animationTime*3+spark*Math.PI,orbit=wingSize*.52;ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(wingX+Math.cos(angle)*orbit,wingY+Math.sin(angle)*orbit,2.5,0,Math.PI*2);ctx.fill();}ctx.restore();}drawSprite(art[dragon.art],(pframe+index*3)%12,wingX,wingY,wingSize,wing.rotation,player.inv>0&&Math.floor(player.inv*14)%2===0?.45:1);ctx.fillStyle=dragon.color;ctx.fillText(t('hud.wingLevel',{level}),wingX,wingY-wingSize*.54);});
    ctx.restore();
  }
  drawSprite(art.player,pframe,player.x,player.y+pbob,154*player.altitude,0,player.inv>0&&Math.floor(player.inv*14)%2===0?.45:1,player.hitFlash||0);
  const shields=player.wingSlots.filter(wing=>wing.type==='lumina'&&wing.shield>0).length,luminaLevel=player.dragonLevels.lumina;
  for(let i=0;i<shields;i++){ctx.save();ctx.strokeStyle='#7eefff';ctx.lineWidth=3.5+luminaLevel*.55;ctx.globalAlpha=.58+.2*Math.sin(animationTime*5+i);ctx.shadowBlur=16+luminaLevel*3;ctx.shadowColor='#37dfff';ctx.beginPath();ctx.arc(player.x,player.y+pbob,(53+luminaLevel*3+i*8)*player.altitude,0,Math.PI*2);ctx.stroke();ctx.restore();}
}
function drawPlayerHealthBar(){
  const width=94,height=13,x=player.x-width/2,y=player.y-70*player.altitude;
  const ratio=Math.max(0,player.hp/player.maxHp);
  ctx.save();
  ctx.fillStyle='#14242bd9';ctx.strokeStyle='#f5fff0';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(x-3,y-3,width+6,height+6,8);ctx.fill();ctx.stroke();
  ctx.fillStyle='#33484f';ctx.beginPath();ctx.roundRect(x,y,width,height,5);ctx.fill();
  if(ratio>0){ctx.fillStyle=ratio<.3?'#ff5261':'#73ec3e';ctx.beginPath();ctx.roundRect(x,y,width*ratio,height,5);ctx.fill();ctx.fillStyle='#dfffba';ctx.globalAlpha=.7;ctx.fillRect(x+5,y+2,Math.max(0,width*ratio-10),3);}
  ctx.globalAlpha=1;ctx.fillStyle='white';ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowBlur=3;ctx.shadowColor='#000';ctx.fillText(t('hud.health',{current:Math.ceil(player.hp),max:player.maxHp}),player.x,y+height/2+.5);ctx.restore();
}
function drawPlayerBullet(b){
  const frame=Math.floor((b.age||0)*18)%6,cycle=[0,1.8,3,1.4,-.8,-1.6][frame],levelScale=1+((b.skillLevel||1)-1)*.1;
  if(b.wingmanType==='ultimate'){
    const angle=Math.atan2(b.vy,b.vx);ctx.save();ctx.translate(b.x,b.y);ctx.rotate(angle);ctx.shadowBlur=24+frame*2;ctx.shadowColor='#ffd83d';const ultimate=ctx.createRadialGradient(1,0,1,0,0,11);ultimate.addColorStop(0,'#ffffff');ultimate.addColorStop(.28,'#fff7a1');ultimate.addColorStop(.65,'#ffb51b');ultimate.addColorStop(1,'#ff5b0b');ctx.fillStyle=ultimate;ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(2,6+cycle*.3);ctx.lineTo(-9,4);ctx.lineTo(-5,0);ctx.lineTo(-9,-4);ctx.lineTo(2,-6-cycle*.3);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff7bd';ctx.lineWidth=2;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(0,0,10+cycle*.45,0,Math.PI*2);ctx.stroke();ctx.restore();return;
  }
  if(b.wingmanType==='venora'){
    const angle=Math.atan2(b.vy,b.vx),wobble=cycle,stretch=[1,1.08,1.15,1.06,.94,.9][frame];
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(angle);ctx.scale(stretch*levelScale,levelScale/stretch);ctx.shadowBlur=18+frame+(b.skillLevel||1)*2;ctx.shadowColor='#72ff35';
    const poison=ctx.createLinearGradient(-22,0,12,0);poison.addColorStop(0,'#8b43b8');poison.addColorStop(.42,'#a45bd0');poison.addColorStop(.72,'#9be94b');poison.addColorStop(1,'#e8ff9a');
    ctx.fillStyle=poison;ctx.beginPath();ctx.moveTo(12,0);ctx.bezierCurveTo(7,-8,-1,-10,-8,-6);ctx.bezierCurveTo(-14,-4+wobble,-18,-1,-25,-2);ctx.bezierCurveTo(-18,3,-13,7-wobble,-7,7);ctx.bezierCurveTo(0,10,8,7,12,0);ctx.closePath();ctx.fill();
    ctx.fillStyle='#caff71';ctx.globalAlpha=.85;ctx.beginPath();ctx.ellipse(5,-3,4,2.4,-.2,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.9;ctx.fillStyle='#7bdc32';ctx.beginPath();ctx.arc(-18-frame*1.2,7+wobble,3.2-frame*.12,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.6;ctx.beginPath();ctx.arc(-27-frame*1.8,-4-wobble,Math.max(1,2.4-frame*.22),0,Math.PI*2);ctx.fill();ctx.globalAlpha=.72;ctx.beginPath();ctx.arc(-10-frame,10-wobble*.5,1.5+(frame%2),0,Math.PI*2);ctx.fill();ctx.restore();return;
  }
  if(b.wingmanType==='ignis'){
    const flicker=cycle,scale=1+[0,.05,.1,.04,-.03,-.06][frame],travelRotation=Math.atan2(b.vy,b.vx)+Math.PI/2;
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(travelRotation+(frame-2.5)*.025);ctx.scale(scale*levelScale,scale*levelScale);ctx.shadowBlur=20+frame*2+(b.skillLevel||1)*2;ctx.shadowColor='#ff4b12';
    ctx.fillStyle='#ff4a0b';ctx.beginPath();ctx.moveTo(-6,5);ctx.quadraticCurveTo(-10,15+flicker,-2,25);ctx.quadraticCurveTo(0,16,3,22-flicker);ctx.quadraticCurveTo(10,13,6,5);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffad19';ctx.beginPath();ctx.moveTo(-4,4);ctx.quadraticCurveTo(-4,13,0,18+flicker);ctx.quadraticCurveTo(5,11,4,4);ctx.closePath();ctx.fill();
    const fire=ctx.createRadialGradient(-2,-3,1,0,0,9);fire.addColorStop(0,'#fffbd2');fire.addColorStop(.28,'#ffe554');fire.addColorStop(.62,'#ff8a12');fire.addColorStop(1,'#d92c08');
    ctx.fillStyle=fire;ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(-2.5,-2.5,2.2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffb21b';ctx.globalAlpha=.75;ctx.beginPath();ctx.arc(-5+(frame%3)*4,16+frame*1.6,Math.max(1,3-frame*.3),0,Math.PI*2);ctx.fill();ctx.restore();
    return;
  }
  const width=7+cycle*.45,tail=9+frame*.7,grad=ctx.createLinearGradient(b.x,b.y+14,b.x,b.y-15);grad.addColorStop(0,'#ff7b1a');grad.addColorStop(.45,'#ffd544');grad.addColorStop(1,'#fffbd0');ctx.fillStyle=grad;ctx.shadowBlur=14+frame;ctx.shadowColor='#ff8c27';ctx.beginPath();ctx.moveTo(b.x,b.y-16-cycle*.3);ctx.lineTo(b.x+width,b.y+tail);ctx.lineTo(b.x,b.y+5+cycle);ctx.lineTo(b.x-width,b.y+tail);ctx.closePath();ctx.fill();
}
function drawPoisonCoating(e){
  if(!(e.poisonTime>0))return;
  const scale=e.elite?1.3:1,fade=Math.min(1,e.poisonTime/.35),pulse=Math.sin(animationTime*8+e.phase);
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.rotation);ctx.globalAlpha=.72*fade;ctx.shadowBlur=11;ctx.shadowColor='#65ff2d';ctx.fillStyle='#72d52ccc';
  ctx.beginPath();ctx.ellipse(-13*scale,-7*scale,(10+pulse)*scale,6*scale,-.35,0,Math.PI*2);ctx.ellipse(12*scale,3*scale,(8-pulse*.6)*scale,7*scale,.4,0,Math.PI*2);ctx.ellipse(-2*scale,15*scale,7*scale,9*scale,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#baff54';ctx.globalAlpha=.82*fade;ctx.beginPath();ctx.arc(-15*scale,-10*scale,2.8*scale,0,Math.PI*2);ctx.arc(10*scale,0,2.2*scale,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#55a91f';ctx.globalAlpha=.7*fade;const drip=7+Math.sin(animationTime*10+e.phase)*3;ctx.beginPath();ctx.moveTo(-3*scale,16*scale);ctx.quadraticCurveTo(-1*scale,(20+drip)*scale,2*scale,(27+drip)*scale);ctx.quadraticCurveTo(6*scale,21*scale,4*scale,15*scale);ctx.closePath();ctx.fill();ctx.restore();
}
function drawEnemyHealthBar(e){
  const width=e.chapterBoss?190:e.boss?140:e.champion?110:e.elite?82:52,height=e.chapterBoss?13:e.boss?10:e.champion?9:e.elite?7:5,y=e.chapterBoss?-122:e.boss?-94:e.champion?-75:e.elite?-58:-41,ratio=clamp(e.hp/e.max,0,1);
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.rotation);ctx.fillStyle='#18252bdd';ctx.strokeStyle=e.boss?'#ffcf4e':e.elite?'#9aa9b0':'#263a44';ctx.lineWidth=e.boss?2.5:e.elite?2:1.5;ctx.beginPath();ctx.roundRect(-width/2-2,y-2,width+4,height+4,height);ctx.fill();ctx.stroke();ctx.fillStyle='#33484f';ctx.fillRect(-width/2,y,width,height);if(ratio>0){ctx.fillStyle=ratio<.3?'#ff5261':e.boss?'#ff7b31':e.elite?'#ffcf4e':'#8fe94b';ctx.fillRect(-width/2,y,width*ratio,height);ctx.fillStyle='#ffffff';ctx.globalAlpha=.5;ctx.fillRect(-width/2+2,y+1,Math.max(0,width*ratio-4),1);}ctx.restore();
}
function drawVirtualJoystick(){if(!pointer.active||state!=='play')return;const pulse=.96+Math.sin(animationTime*7)*.025;ctx.save();ctx.globalAlpha=.72;ctx.lineWidth=4;ctx.strokeStyle='#d9fbff';ctx.fillStyle='#092f4588';ctx.shadowBlur=16;ctx.shadowColor='#43dfff';ctx.beginPath();ctx.arc(pointer.baseX,pointer.baseY,pointer.radius*pulse,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.globalAlpha=.9;const knob=ctx.createRadialGradient(pointer.knobX-8,pointer.knobY-8,3,pointer.knobX,pointer.knobY,30);knob.addColorStop(0,'#ffffff');knob.addColorStop(.35,'#8ef1ff');knob.addColorStop(1,'#168fc4');ctx.fillStyle=knob;ctx.strokeStyle='#e8ffff';ctx.lineWidth=3;ctx.shadowBlur=14;ctx.beginPath();ctx.arc(pointer.knobX,pointer.knobY,27,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
function drawLightningEffect(effect){
  const progress=1-effect.life/effect.max,level=effect.level||1,edgeCount=effect.points.length-1,erase=progress*edgeCount,endFade=Math.min(1,effect.life/.12);
  ctx.save();ctx.globalAlpha=endFade;ctx.lineJoin='round';ctx.lineCap='round';ctx.shadowBlur=18+level*4;ctx.shadowColor='#58caff';
  for(let pass=0;pass<2;pass++){
    ctx.strokeStyle=pass?'#ffffff':'#4cbcff';ctx.lineWidth=pass?1.7+level*.35:6+level*1.15;
    for(let edge=0;edge<edgeCount;edge++){
      const localStart=clamp(erase-edge,0,1);if(localStart>=1)continue;
      const from=effect.points[edge],to=effect.points[edge+1],segments=7,startX=from.x+(to.x-from.x)*localStart,startY=from.y+(to.y-from.y)*localStart;
      ctx.beginPath();ctx.moveTo(startX,startY);
      for(let step=Math.max(1,Math.ceil(localStart*segments));step<=segments;step++){
        const ratio=step/segments,jitter=step===segments?0:Math.sin((edge*11+step)*9+animationTime*55)*10;
        ctx.lineTo(from.x+(to.x-from.x)*ratio+jitter,from.y+(to.y-from.y)*ratio);
      }
      ctx.stroke();
    }
  }
  effect.points.slice(1).forEach((point,index)=>{
    const targetFade=1-clamp(erase-index-.45,0,1);if(targetFade<=0)return;
    ctx.save();ctx.translate(point.x,point.y);ctx.rotate(animationTime*7+index);ctx.globalAlpha=targetFade*endFade;ctx.strokeStyle=index%2?'#fff7a1':'#6ee7ff';ctx.lineWidth=2.2+level*.25;ctx.shadowBlur=14+level*2;
    const radius=13+level*2;
    for(let arc=0;arc<3;arc++){ctx.beginPath();ctx.arc(0,0,radius+arc*4,arc*2.05,arc*2.05+1.2);ctx.stroke();}
    for(let spark=0;spark<3;spark++){const angle=spark*Math.PI*2/3+animationTime*10;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(Math.cos(angle)*radius,Math.sin(angle)*radius,2,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  });
  ctx.restore();
}
function enemyShotColors(s){
  if(s.type==='chapterHoming')return {core:'#fff2ff',mid:'#b64dff',dark:'#42106f',edge:'#f0b7ff',trail:'#8c28e8'};
  if(s.type==='chapterEnergy')return {core:'#ffe4ff',mid:'#a838ed',dark:'#33105f',edge:'#eeb0ff',trail:'#7720c9'};
  if(s.type==='enhancedOrb')return {core:'#ecffff',mid:'#34c8ff',dark:'#174797',edge:'#ffd85a',trail:'#1f78d6'};
  if(s.type==='orb')return {core:'#ffd6fb',mid:'#e233c8',dark:'#62106f',edge:'#ff9df4',trail:'#a41ec2'};
  return {core:'#e6d5ff',mid:'#7b3cff',dark:'#32106f',edge:'#b694ff',trail:'#6a2ad4'};
}
function drawJaggedEnergy(radius, seed, wobble=.12){
  const points=10,step=Math.PI*2/points;
  ctx.beginPath();
  for(let i=0;i<points;i++){
    const angle=i*step+Math.sin(seed+i*1.7)*.08;
    const jag=1+(Math.sin(seed*1.9+i*2.37)+Math.sin(animationTime*9+i+seed))*.5*wobble;
    const r=radius*jag;
    const x=Math.cos(angle)*r,y=Math.sin(angle)*r;
    if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
  }
  ctx.closePath();
}
function drawEnemyShotCharge(s){
  if(s.type!=='chapterHoming'||s.charge<=0)return;
  const chargeProgress=1-s.charge/.9,pulse=1+Math.sin(animationTime*16)*.06,colors=enemyShotColors(s);
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=colors.trail;ctx.shadowBlur=11;ctx.shadowColor=colors.mid;ctx.globalAlpha=.24+chargeProgress*.34;ctx.lineWidth=1.6+chargeProgress*1.6;
  ctx.beginPath();ctx.moveTo(s.source?.x??s.x,s.source?.y+18??s.y);ctx.lineTo(s.x,s.y);ctx.stroke();
  ctx.translate(s.x,s.y);ctx.rotate(animationTime*(s.side||1)*1.8);
  for(let claw=0;claw<5;claw++){const a=claw*Math.PI*2/5+Math.sin(animationTime*5+claw)*.08,r=s.r+11+chargeProgress*8;ctx.save();ctx.rotate(a);ctx.strokeStyle=claw%2?colors.edge:colors.mid;ctx.lineWidth=1.8;ctx.globalAlpha=.22+chargeProgress*.3;ctx.beginPath();ctx.moveTo(r*.35,-3*pulse);ctx.lineTo(r,0);ctx.lineTo(r*.45,5*pulse);ctx.stroke();ctx.restore();}
  const core=ctx.createRadialGradient(-3,-3,1,0,0,s.r+8);core.addColorStop(0,colors.core);core.addColorStop(.45,colors.mid);core.addColorStop(1,'#3a0d6200');ctx.fillStyle=core;ctx.globalAlpha=.28+chargeProgress*.32;drawJaggedEnergy((s.r+7)*pulse,animationTime+s.x*.03,.18);ctx.fill();ctx.restore();
}
function drawEnemyShot(s){
  const colors=enemyShotColors(s),homing=s.type==='chapterHoming',chapter=homing||s.type==='chapterEnergy',enhanced=s.type==='enhancedOrb',angle=Math.atan2(s.vy||1,s.vx||0),speed=Math.hypot(s.vx||0,s.vy||0),seed=(s.x*.073+s.y*.041+(s.age||0)*2.7),radius=s.r*(homing?1.1:chapter?1.05:1);
  ctx.save();ctx.translate(s.x,s.y);ctx.rotate(angle);ctx.globalCompositeOperation='lighter';ctx.shadowBlur=homing?28:chapter?21:enhanced?15:10;ctx.shadowColor=colors.mid;
  for(let i=0;i<3;i++){const trail=(radius*(1.05+i*.45))*(homing?1.2:1),back=-radius*(1.1+i*.7)-Math.min(18,speed*.035),alpha=.2-i*.055;ctx.globalAlpha=alpha;ctx.fillStyle=i%2?colors.dark:colors.trail;ctx.beginPath();ctx.moveTo(-radius*.25,0);ctx.quadraticCurveTo(back,-trail*.42,-back*.55,0);ctx.quadraticCurveTo(back,trail*.36,-radius*.25,0);ctx.fill();}
  ctx.globalAlpha=.78;const outer=ctx.createRadialGradient(-radius*.18,-radius*.18,1,0,0,radius*1.2);outer.addColorStop(0,colors.core);outer.addColorStop(.32,colors.mid);outer.addColorStop(.74,colors.dark);outer.addColorStop(1,'#10021a');ctx.fillStyle=outer;drawJaggedEnergy(radius*(1+Math.sin((s.age||0)*10)*.035),seed,homing?.28:.2);ctx.fill();
  ctx.globalAlpha=.7;ctx.strokeStyle=colors.edge;ctx.lineWidth=chapter?1.8:1.35;drawJaggedEnergy(radius*(chapter?1.18:1.1),seed+3.2,homing?.34:.25);ctx.stroke();
  ctx.globalAlpha=.56;ctx.fillStyle=colors.core;ctx.beginPath();ctx.ellipse(-radius*.22,-radius*.18,radius*.2,radius*.11,-.45,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.42;ctx.fillStyle=colors.edge;for(let shard=0;shard<(chapter?7:4);shard++){const a=shard*Math.PI*2/(chapter?7:4)+animationTime*(homing?-1.6:1.1),r=radius*(1.1+(shard%3)*.12),len=homing?8:5;ctx.save();ctx.rotate(a);ctx.translate(r,0);ctx.beginPath();ctx.moveTo(len,0);ctx.lineTo(-len*.35,Math.max(2,radius*.16));ctx.lineTo(-len*.18,-Math.max(2,radius*.14));ctx.closePath();ctx.fill();ctx.restore();}
  if(homing){ctx.globalAlpha=.12;ctx.fillStyle=colors.mid;drawJaggedEnergy(radius*1.9+Math.sin((s.age||0)*7)*3,seed+8,.32);ctx.fill();}
  ctx.restore();
}
function draw(){
  ctx.clearRect(0,0,W,H);drawBackground();if(!player)return;
  essences.forEach(item=>{const pulse=1+Math.sin(animationTime*7+item.x)*.08,size=item.r*pulse;ctx.save();ctx.translate(item.x,item.y);ctx.rotate(animationTime*(item.refined?1.8:2.8));ctx.shadowBlur=item.refined?26:17;ctx.shadowColor=item.refined?'#ffd83d':'#45eaff';ctx.fillStyle=item.refined?'#ffd84a':'#42dff5';ctx.strokeStyle='#fffbd0';ctx.lineWidth=item.refined?3:2;ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(size*.72,0);ctx.lineTo(0,size);ctx.lineTo(-size*.72,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ffffff';ctx.globalAlpha=.8;ctx.beginPath();ctx.moveTo(-2,-size*.62);ctx.lineTo(size*.28,-1);ctx.lineTo(-1,size*.2);ctx.closePath();ctx.fill();if(item.refined){ctx.globalAlpha=.75;ctx.strokeStyle='#fff27a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,size+6,0,Math.PI*2);ctx.stroke();}ctx.restore();});
  gems.forEach(g=>{ctx.fillStyle='#a8ff62';ctx.shadowBlur=14;ctx.shadowColor='#54ff74';ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fffbc0';ctx.beginPath();ctx.arc(g.x-2,g.y-2,3,0,Math.PI*2);ctx.fill();});ctx.shadowBlur=0;
  bullets.forEach(drawPlayerBullet);ctx.shadowBlur=0;
  lasers.forEach(l=>{const x2=l.x+l.dx*1200,y2=l.y+l.dy*1200,isActive=l.age>=l.warn;ctx.save();ctx.lineCap='round';if(isActive){ctx.globalAlpha=1;ctx.strokeStyle='#fff6d0';ctx.shadowBlur=l.boss?34:22;ctx.shadowColor='#ff342d';ctx.lineWidth=l.boss?24:15;ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(x2,y2);ctx.stroke();ctx.strokeStyle=l.boss?'#ff241c':'#ff3b31';ctx.lineWidth=l.boss?11:7;ctx.stroke();}else{const pulse=.35+.35*Math.sin(l.age*28);ctx.globalAlpha=.48+pulse;ctx.setLineDash(l.boss?[18,8]:[14,10]);ctx.strokeStyle=l.boss?'#ff3028':'#ff534b';ctx.lineWidth=(l.boss?5:3)+pulse*(l.boss?4:2);ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(x2,y2);ctx.stroke();}ctx.restore();});
  enemies.forEach(e=>{const frame=Math.floor(e.anim)%12,size=e.chapterBoss?310:e.boss?240:e.champion?180:e.elite?150:108,flap=Math.sin(e.anim*Math.PI/6),bob=e.chapterBoss?flap*.75:flap*1.2,aiming=lasers.some(l=>l.source===e),flightTilt=e.chapterBoss?Math.sin(e.anim*Math.PI/6+e.phase)*.004:aiming?0:Math.sin(time*2+e.phase)*.018,rotation=e.rotation+flightTilt;drawMonsterVisual(e,frame,e.y+bob,size,rotation);drawPoisonCoating(e);drawEnemyHealthBar(e);});
  lightningEffects.forEach(drawLightningEffect);
  fireImpacts.forEach(impact=>{const progress=1-impact.life/impact.max,radius=7+progress*25,alpha=impact.life/impact.max;ctx.save();ctx.translate(impact.x,impact.y);ctx.globalAlpha=alpha;ctx.shadowBlur=18;ctx.shadowColor='#ff4a0b';ctx.strokeStyle='#ff8b19';ctx.lineWidth=5*(1-progress)+1;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();const flash=ctx.createRadialGradient(0,0,0,0,0,13);flash.addColorStop(0,'#ffffff');flash.addColorStop(.28,'#fff17a');flash.addColorStop(.7,'#ff7014');flash.addColorStop(1,'#ff2c0000');ctx.fillStyle=flash;ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();ctx.restore();});
  enemyShots.forEach(drawEnemyShotCharge);
  enemyShots.forEach(drawEnemyShot);
  particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,3.2,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;
  drawPlayerCharacter();
  drawPlayerHealthBar();
  updateHud();
  damageTexts.forEach(text=>{const progress=1-text.life/text.max,isHeal=text.type==='heal';ctx.save();ctx.globalAlpha=Math.min(1,text.life/.16);ctx.translate(text.x,text.y);ctx.scale(1+Math.max(0,.22-progress)*.8,1+Math.max(0,.22-progress)*.8);ctx.fillStyle=isHeal?'#69ff8c':'#ff3f49';ctx.strokeStyle=isHeal?'#075c28':'#4b0710';ctx.lineWidth=4;ctx.font=isHeal?'1000 19px system-ui':'1000 17px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';const value=isHeal?`+${text.amount} HP`:t('combat.damage',{amount:text.amount});ctx.strokeText(value,0,0);ctx.fillText(value,0,0);ctx.restore();});
  drawVirtualJoystick();
  if(waveBanner>0){const fade=Math.min(1,waveBanner/.45,(2.4-waveBanner)/.35);ctx.save();ctx.globalAlpha=Math.max(0,fade);ctx.textAlign='center';ctx.fillStyle='#09293bc9';ctx.roundRect(W/2-112,105,224,72,20);ctx.fill();ctx.strokeStyle='#c9ff7c';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.shadowBlur=14;ctx.shadowColor='#69eaff';ctx.font='900 34px system-ui';ctx.fillText(t('hud.wave',{wave}),W/2,151);ctx.restore();}
}

function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop);}requestAnimationFrame(loop);
document.querySelector('#titleStart').onclick=()=>{state='lobby';ui.title.classList.remove('visible');ui.lobby.classList.add('visible');};
document.querySelector('#lobbyPlay').onclick=reset;
document.querySelector('#restart').onclick=reset;
ui.reroll.onclick=()=>{if(state!=='upgrade'||player.rerolls<=0)return;const previous=JSON.parse(ui.reroll.dataset.choices||'[]');player.rerolls--;renderUpgradeChoices(previous);};
document.querySelector('#backLobby').onclick=()=>{releaseVirtualJoystick();state='lobby';ui.over.classList.remove('visible');ui.lobby.classList.add('visible');hud.root.classList.remove('visible');ultimateButton.classList.remove('visible');};
document.querySelector('#pause').onclick=()=>{if(state==='play'){releaseVirtualJoystick();state='paused';ui.pause.classList.add('visible');ultimateButton.classList.remove('visible');}};
document.querySelector('#resume').onclick=()=>{if(state==='paused'){state='play';ui.pause.classList.remove('visible');ultimateButton.classList.add('visible');last=performance.now();}};
document.querySelector('#skipBoss').onclick=jumpToChapterBoss;
ultimateButton.addEventListener('pointerdown',e=>e.stopPropagation());
ultimateButton.addEventListener('click',useUltimate);
addEventListener('keydown',e=>keys.add(e.code));addEventListener('keyup',e=>keys.delete(e.code));
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
function updateVirtualJoystick(e){const p=canvasPoint(e),vx=p.x-pointer.baseX,vy=p.y-pointer.baseY,distance=Math.hypot(vx,vy),travel=Math.min(pointer.radius,distance),nx=distance?vx/distance:0,ny=distance?vy/distance:0;pointer.knobX=pointer.baseX+nx*travel;pointer.knobY=pointer.baseY+ny*travel;if(distance<=pointer.deadzone){pointer.dx=pointer.dy=0;}else{pointer.dx=nx;pointer.dy=ny;}}
function releaseVirtualJoystick(e){if(!pointer.active||(e&&e.pointerId!==pointer.id))return;pointer.active=false;pointer.id=null;pointer.dx=pointer.dy=0;}
canvas.addEventListener('pointerdown',e=>{if(state!=='play'||pointer.active)return;e.preventDefault();const p=canvasPoint(e);pointer.active=true;pointer.id=e.pointerId;pointer.baseX=pointer.knobX=p.x;pointer.baseY=pointer.knobY=p.y;pointer.dx=pointer.dy=0;canvas.setPointerCapture?.(e.pointerId);});
function handlePointerMove(e){if(!pointer.active||e.pointerId!==pointer.id)return;e.preventDefault();const latest=e.getCoalescedEvents?.().at(-1)||e;updateVirtualJoystick(latest);}
canvas.addEventListener('pointermove',handlePointerMove);
canvas.addEventListener('pointerrawupdate',handlePointerMove);
canvas.addEventListener('pointerup',releaseVirtualJoystick);canvas.addEventListener('pointercancel',releaseVirtualJoystick);canvas.addEventListener('lostpointercapture',releaseVirtualJoystick);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
