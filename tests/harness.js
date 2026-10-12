// Loads the game's scripts (in the order football-manager.html lists them) into a sandbox with a minimal fake
// DOM and localStorage, then runs a test's code in the same scope, so it can call game functions directly.
// Tests report with ok(condition, message), which prints PASS or FAIL.
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');

exports.run=(code,extra={})=>{
  const store={},el=()=>({innerHTML:'',hidden:true,textContent:'',contains:()=>false,querySelector:()=>null,querySelectorAll:()=>[]});
  const els={app:el(),toast:el(),sr:el()};
  const ctx={els,store,console,Math,JSON,Set,Blob,setTimeout:()=>0,clearTimeout(){},window:{scrollTo(){}},
    localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]},
    document:{getElementById:i=>els[i],addEventListener(){},activeElement:null,body:{style:{}}},...extra};
  vm.createContext(ctx);
  const files=fs.readFileSync(path.join(root,'football-manager.html'),'utf8').match(/js\/\w+\.js/g);
  const prelude='const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);const bad=h=>/undefined|NaN|\\[object/.test(h);'+
    // fast-forward stops on a day that brings transfer bids; most tests just want the next match day
    'const ffToMatch=()=>{let g=0;do{if(S.offers&&S.offers.length)ACT.offerNo();ACT.ff()}while(!seasonDone()&&!isMatchDay()&&g++<60)};';
  vm.runInContext(files.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n;\n')+'\n;\n'+prelude+'\n'+code,ctx);
};
