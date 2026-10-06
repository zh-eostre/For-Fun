// Save files: an exported save loads; save panel and start screen offer folder loading.
require('./harness').run(`

// the real exported save in the saves folder loads
newGame(11,teamNames());const REAL=JSON.stringify(S);S=null;loadSaveText(REAL);ok(S&&S.v===SAVE_V&&my().name,'an exported save loads: '+my().name+', 第 '+S.season+' 季');
UI.tab='home';render();ok(/存档文件/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'save panel renders (fallback mode, no folder API here)');
// simulate a browser with the folder API: panel and start screen offer the folder buttons and the file list
window.showDirectoryPicker=()=>{};UI.saveFiles=[{name:'绿茵经理-火凤-第1季第1轮.json',time:Date.now()}];render();
ok(/导出到存档文件夹/.test(els.app.innerHTML)&&/从存档文件夹读取/.test(els.app.innerHTML)&&/data-act="loadDir"/.test(els.app.innerHTML),'with the folder API: folder buttons and file list');
const keep=S;S=null;render();ok(/从存档文件夹读取/.test(els.app.innerHTML)&&/data-act="loadDir"/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'start screen offers loading from the folder');
`);
