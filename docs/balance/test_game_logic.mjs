import fs from 'node:fs';
import vm from 'node:vm';

const elements = new Map();
function element(id='') {
  if (elements.has(id)) return elements.get(id);
  const value = {
    id, style:{}, dataset:{}, textContent:'', innerHTML:'', disabled:false,
    classList:{add(){},remove(){},toggle(){}},
    setAttribute(){}, addEventListener(){},
    querySelector(selector){return element(`${id}:${selector}`);},
    getBoundingClientRect(){return {left:0,top:0,width:540,height:960};},
  };
  elements.set(id,value); return value;
}
const gradient = { addColorStop(){} };
const ctx = new Proxy({}, { get(target,key){if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>gradient;if(!(key in target))target[key]=()=>{};return target[key];}, set(target,key,value){target[key]=value;return true;} });
const canvas = element('game'); canvas.width=540; canvas.height=960; canvas.getContext=()=>ctx;
const document = {
  documentElement:{lang:''}, title:'',
  querySelector(selector){return selector==='#game'?canvas:element(selector);},
  querySelectorAll(){return [];}, createElement(){return element(`created-${Math.random()}`);},
};
class MockImage { constructor(){this.complete=true;this.naturalWidth=3072;this.naturalHeight=256;} set src(value){this._src=value;} }
const context = {document,window:{},location:{search:'?lang=ko'},navigator:{language:'ko'},URLSearchParams,Image:MockImage,requestAnimationFrame(){},addEventListener(){},performance:{now:()=>0},console,Math};
vm.createContext(context);
const strings=fs.readFileSync('strings.js','utf8');
const game=fs.readFileSync('game.js','utf8');
vm.runInContext(`${strings}\n${game}\n;globalThis.TEST={reset,getUpgradeOptions,spawnBoss:()=>{wave=3;spawnMiniBoss();return enemies.find(e=>e.boss);},defeatBoss:()=>{const boss=enemies.find(e=>e.boss);defeatEnemy(boss);return essences.find(e=>e.refined);},fireUltimate:()=>{state='play';player.ultimateGauge=100;useUltimate();return {count:bullets.filter(b=>b.wingmanType==='ultimate').length,gauge:player.ultimateGauge,damage:bullets.find(b=>b.wingmanType==='ultimate').damage};},getState:()=>({slots:player.wingSlots.map(w=>w.type),levels:{...player.dragonLevels}})};`,context);
context.TEST.reset();
for(const name of ['이그니스','루미나','볼티스','베노라']){
  const option=context.TEST.getUpgradeOptions().find(item=>item.name.includes(name));
  if(!option)throw new Error(`missing dragon option: ${name}`);
  option.apply();
}
const state=context.TEST.getState();
const boss=context.TEST.spawnBoss();
const refined=context.TEST.defeatBoss(),ultimate=context.TEST.fireUltimate();
console.log(JSON.stringify({...state,boss:{hp:boss.hp,pattern:boss.pattern,scoreValue:250},refined,ultimate}));
if(state.slots.join(',')!=='ignis,lumina,voltis,venora')process.exit(1);
if(!boss||boss.pattern!=='bossLaser')process.exit(1);
if(!refined||refined.value!==30||ultimate.count!==24||ultimate.gauge!==0||ultimate.damage!==27)process.exit(1);
