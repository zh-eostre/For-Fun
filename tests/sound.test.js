// Sound effects: played through Web Audio when on, silent when switched off or while a match is skipped; the
// switch is in the header, the match controls and the rules, and is remembered on the device.
const made={osc:0,audio:[]};
class FakeAudioEl{constructor(src){this.src=src;this.paused=true;this.currentTime=0;made.els=(made.els||0)+1} play(){this.paused=false;this.currentTime=0;made.audio.push(this.src);return Promise.resolve()} pause(){this.paused=true}}
const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},connect(x){return x}});
const node=extra=>Object.assign({connect(x){return x},start(){},stop(){}},extra);
class FakeAudio{constructor(){this.currentTime=0;this.sampleRate=8000;this.state='running';this.destination={}}
  resume(){} createOscillator(){made.osc++;return node({type:'',frequency:param()})} createGain(){return node({gain:param()})}
  createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)}} createBufferSource(){return node({})} createBiquadFilter(){return node({type:'',Q:param(),frequency:param()})}}
require('./harness').run(`
const made=extra.made;
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;render();
ok(soundOn()&&/data-act="sound"/.test(els.app.innerHTML)&&els.app.innerHTML.includes('🔊'),'sound is on by default, with a switch in the header');
let n=made.osc;sfx('goal');ok(made.audio.slice(-1)[0]==='sounds/goal.wav'&&made.osc===n,'a goal plays the recorded cheer');
n=made.osc;sfx('concede');ok(made.audio.slice(-1)[0]==='sounds/concede.wav'&&made.osc===n,'a goal against: the disappointed sigh');
n=made.osc;sfx('roar');ok(made.audio.slice(-1)[0]==='sounds/roar.wav'&&made.osc>n,'a title or a 绝杀: the roar, with the fanfare over it');
// goals in quick succession: one crowd at a time, restarted rather than piled up
{const els=made.els;sfx('goal');sfx('goal');sfx('concede');const g=sampleEls.goal,c=sampleEls.concede;
  ok(made.els===els&&g.paused&&!c.paused&&crowdNow===c,'a new crowd sound cuts off the one playing; the same players are reused');}
const keepA=Audio;Audio=undefined;n=made.osc;sfx('goal');ok(made.osc>n,'no audio elements: the synthesised cheer stands in');Audio=keepA;
['kickoff','half','full','card','red','sig','fanfare'].forEach(k=>{const m=made.osc;sfx(k);ok(made.osc>m,k+' plays')});
ACT.sound();ok(!soundOn()&&store[SOUND_KEY]==='off'&&els.app.innerHTML.includes('🔇'),'switched off, remembered on the device');
n=made.osc;const na=made.audio.length;sfx('goal');ok(made.osc===n&&made.audio.length===na,'and silent');
ACT.sound();ok(soundOn(),'and back on');
// a live match: a whistle at kickoff; nothing while it is skipped
S.friendlies.forEach(f=>f.res={hg:0,ag:0});ACT.ff();S.event=null;S.offer=null;n=made.osc;startMatch();clearTimeout(M.timer);
ok(made.osc>n,'kickoff whistle');render();ok(/class="mctl"><button class="btn small" data-act="sound"/.test(els.app.innerHTML),'the match controls have the switch too');
n=made.osc;skipMatch();ok(made.osc===n,'a skipped match is silent');
`,{window:{scrollTo(){},AudioContext:FakeAudio},Audio:FakeAudioEl,extra:{made}});
