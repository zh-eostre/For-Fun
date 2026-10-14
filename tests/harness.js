// Loads the game's scripts (in the order abyss-tower.html lists them) into a sandbox with a minimal fake DOM,
// localStorage and timers, then runs a test's code (as an async function) in the same scope.
// Tests report with ok(condition, message), which prints PASS or FAIL. flush() runs the pending timers (the enemies'
// turn waits on them) until nothing is left.
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
exports.run=(code,extra={})=>{
  const store={},timers=[],el=()=>({innerHTML:'',hidden:true,textContent:''});
  const els={app:el(),ov:el(),toast:el()};
  const ctx={els,store,timers,macro:()=>new Promise(r=>setImmediate(r)),console,Math,JSON,Promise,performance:{now:()=>Date.now()},
    setTimeout:(f)=>{timers.push(f);return timers.length},clearTimeout(){},
    window:{scrollTo(){}},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k]},
    document:{getElementById:i=>els[i],addEventListener(){}},...extra};
  vm.createContext(ctx);
  const files=fs.readFileSync(path.join(root,'abyss-tower.html'),'utf8').match(/js\/\w+\.js/g);
  const prelude=`const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);const bad=h=>/undefined|NaN|\\[object/.test(h);
    const flush=async()=>{for(let i=0;i<2000;i++){const q=timers.splice(0);if(!q.length){await macro();if(!timers.length)return;continue}q.forEach(f=>f());await macro()}};`;
  const src=files.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n;\n')+'\n;\n'+prelude+'\n(async()=>{'+code+'\n})().catch(e=>{console.log("FAIL threw: "+e.stack);process.exitCode=1});';
  vm.runInContext(src,ctx,{filename:'game'});
};
