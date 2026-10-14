// Save files: an exported save loads; save panel and start screen offer folder loading.
require('./harness').run(`

// the real exported save in the saves folder loads
newGame(11,teamNames());const REAL=JSON.stringify(S);S=null;loadSaveText(REAL);ok(S&&S.v===SAVE_V&&my().name,'an exported save loads: '+my().name+', 第 '+S.season+' 季');
UI.tab='home';render();ok(/存档文件/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'save panel renders (fallback mode, no folder API here)');
// simulate a browser with the folder API: panel and start screen offer the folder buttons and the file list
window.showDirectoryPicker=()=>{};UI.saveFiles=[{name:'绿茵经理-火凤-第1季第1轮.json',time:Date.now()}];render();
ok(/导出到存档文件夹/.test(els.app.innerHTML)&&/从存档文件夹读取/.test(els.app.innerHTML)&&/data-act="loadDir"/.test(els.app.innerHTML),'with the folder API: folder buttons and file list');
render();ok(/data-act="exportSnap"/.test(els.app.innerHTML)&&/每次覆盖/.test(els.app.innerHTML),'export overwrites the club\u2019s file; a button keeps a copy of this round');
// exporting into a folder: the club's file is replaced each time, a copy keeps the round's name
{const dir={name:'saves',files:{},queryPermission:async()=>'granted',getFileHandle:async n=>({createWritable:async()=>({write:async t=>{dir.files[n]=t},close:async()=>{}})})};
  window.showDirectoryPicker=async()=>dir;const club=saveName(),snap=saveName(true);
  exportSave(false).then(()=>{S.season++;return exportSave(false)}).then(()=>exportSave(false,true)).then(()=>{
    ok(Object.keys(dir.files).sort().join()===[club,saveName(true)].sort().join()&&JSON.parse(dir.files[club]).season===S.season,'two exports wrote one file ('+club+'), the second over the first; 另存 kept '+saveName(true)+'');
    ok(club==='绿茵经理-'+my().short+'.json'&&/第[0-9]+季第[0-9]+轮\.json$/.test(snap),'the names: the club\u2019s file, and one with the season and round')})}
const keep=S;S=null;render();ok(/从存档文件夹读取/.test(els.app.innerHTML)&&/data-act="loadDir"/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'start screen offers loading from the folder');S=keep;  // the folder exports above finish after this, with the game back
`);
