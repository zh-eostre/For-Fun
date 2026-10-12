// 绿茵经理 as a desktop app: one window showing the game. The game itself is unchanged; prepare.js copies it into
// app/ (with its fonts, so it looks the same offline) before every start or build.
const {app,BrowserWindow,shell}=require('electron');
const path=require('path');

function createWindow(){
  const win=new BrowserWindow({
    width:1280,height:860,minWidth:380,minHeight:600,title:'绿茵经理',backgroundColor:'#18201B',
    autoHideMenuBar:true,icon:path.join(__dirname,'build','icon.png'),
    webPreferences:{contextIsolation:true,sandbox:true}
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname,'app','football-manager.html'));
  // links out of the game open in the normal browser, never inside the game window
  win.webContents.setWindowOpenHandler(({url})=>{shell.openExternal(url);return {action:'deny'}});
  win.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith('file:')){e.preventDefault();shell.openExternal(url)}});
  // F11: full screen on and off
  win.webContents.on('before-input-event',(e,input)=>{
    if(input.type==='keyDown'&&input.key==='F11'){win.setFullScreen(!win.isFullScreen());e.preventDefault()}
  });
}

// one window at a time: two copies of the game would write over each other's save
if(!app.requestSingleInstanceLock())app.quit();
else{
  app.on('second-instance',()=>{const w=BrowserWindow.getAllWindows()[0];if(w){if(w.isMinimized())w.restore();w.focus()}});
  app.whenReady().then(createWindow);
  app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
  app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
}
