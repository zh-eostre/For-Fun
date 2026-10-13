/* ---------- sound effects ----------
   the crowd is recorded (sounds/, see sounds/CREDITS.md): a cheer for our goals, a stadium's "oh" for theirs, applause
   when our keeper saves, a long roar for a title or a 绝杀. the rest is made on the spot with the Web Audio API: whistles, card beeps, a whoosh
   for a signature move, a fanfare. on unless switched off (the setting is kept on this device). nothing plays while
   a match is skipped, or where the browser has no audio */
const SAMPLES={goal:['sounds/goal.wav',.75],concede:['sounds/concede.wav',.8],roar:['sounds/roar.wav',.8],save:['sounds/save.wav',.55]};
// a recording through an <audio> element (works for a page opened from a file, and in the desktop app); false if
// it can't be played, so the synthesised version stands in. the crowd is one voice: a new cheer or groan cuts off the
// one still playing (goals in quick succession restart it rather than piling up)
const sampleEls={};let crowdNow=null;
function playSample(k){
  if(typeof Audio==='undefined'||!SAMPLES[k])return false;
  try{
    const a=sampleEls[k]||(sampleEls[k]=new Audio(SAMPLES[k][0]));
    if(crowdNow&&crowdNow!==a)crowdNow.pause();
    a.volume=SAMPLES[k][1];a.currentTime=0;crowdNow=a;
    const p=a.play();if(p&&p.catch)p.catch(()=>{});return true;
  }catch(e){return false}
}
const SOUND_KEY='lvyin-sound';
let audioCtx=null;
const soundOn=()=>{try{return localStorage.getItem(SOUND_KEY)!=='off'}catch(e){return true}};
function setSound(on){try{localStorage.setItem(SOUND_KEY,on?'on':'off')}catch(e){}}
function ac(){
  if(audioCtx)return audioCtx;
  const C=typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext);
  if(!C)return null;
  try{audioCtx=new C()}catch(e){return null}
  return audioCtx;
}
// one tone: frequency (or [from, to] for a slide), start offset and length in seconds, wave shape, volume
function tone(c,f,at,len,type='sine',vol=.18){
  const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+at;
  o.type=type;
  if(Array.isArray(f)){o.frequency.setValueAtTime(f[0],t);o.frequency.exponentialRampToValueAtTime(f[1],t+len)}else o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.015);g.gain.exponentialRampToValueAtTime(.0008,t+len);
  o.connect(g).connect(c.destination);o.start(t);o.stop(t+len+.05);
  return o;
}
// a burst of filtered noise (crowd, whoosh); sweep: the filter's [from, to] frequency
function noise(c,at,len,sweep,vol=.12){
  const n=Math.floor(c.sampleRate*len),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
  const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime+at;
  s.buffer=buf;f.type='bandpass';f.Q.value=.8;f.frequency.setValueAtTime(sweep[0],t);f.frequency.exponentialRampToValueAtTime(sweep[1],t+len);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+len*.3);g.gain.exponentialRampToValueAtTime(.0008,t+len);
  s.connect(f).connect(g).connect(c.destination);s.start(t);s.stop(t+len+.05);
}
// a referee's whistle: n blasts, the last one long (full time)
function whistle(c,n,longLast){
  for(let i=0;i<n;i++){const len=longLast&&i===n-1?.7:.22,o=tone(c,2900,i*.32,len,'square',.05),lfo=c.createOscillator(),lg=c.createGain();
    lfo.frequency.value=28;lg.gain.value=90;lfo.connect(lg).connect(o.frequency);lfo.start(c.currentTime+i*.32);lfo.stop(c.currentTime+i*.32+len+.05)}
}
const SFX={
  kickoff:c=>whistle(c,1,false),
  half:c=>whistle(c,2,false),
  full:c=>whistle(c,3,true),
  goal:c=>{noise(c,0,1.6,[700,1600],.14);[523,659,784,1047].forEach((f,i)=>tone(c,f,.05+i*.09,.6,'triangle',.16))},
  concede:c=>{tone(c,[392,262],0,.7,'sine',.16);tone(c,[311,208],.12,.8,'sine',.1)},
  card:c=>tone(c,880,0,.12,'square',.06),
  red:c=>{tone(c,[220,150],0,.45,'sawtooth',.08);tone(c,[110,80],0,.5,'sine',.12)},
  sig:c=>{noise(c,0,.5,[300,4000],.1);tone(c,1568,.32,.5,'triangle',.12);tone(c,2093,.42,.6,'triangle',.08)},
  save:c=>{for(let i=0;i<45;i++)noise(c,Math.random()*1.4,.035,[1400,2600],.05*(1-i/60))},  // applause: many quick claps
  fanfare:c=>{[[523,0],[659,.14],[784,.28],[1047,.42],[784,.62],[1047,.76]].forEach(([f,at],i)=>tone(c,f,at,i===5?1:.22,'triangle',.17));noise(c,.4,1.4,[800,1800],.08)}
};
function sfx(kind){
  if(!soundOn()||(typeof M!=='undefined'&&M&&M.skip))return;
  const rec=playSample(kind);  // the crowd, if there's a recording of it
  const synth=kind==='roar'?'fanfare':rec?null:kind;  // a roar has the fanfare over it; otherwise the recording is enough
  if(!synth||!SFX[synth])return;
  const c=ac();if(!c)return;
  try{if(c.state==='suspended')c.resume();SFX[synth](c)}catch(e){}
}
