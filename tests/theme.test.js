// Colour theme: follow the system, or always light / dark; the choice is kept on the device and set on <html>.
require('./harness').run(`
const attrs={};document.documentElement={setAttribute:(k,v)=>attrs[k]=v,removeAttribute:k=>delete attrs[k]};
newGame(2,teamNames());UI.guide=null;UI.tab='home';render();
ok(themeNow()==='auto'&&/data-act="theme"[^>]*>🌓/.test(els.app.innerHTML),'starts following the system, shown in the top bar');
ACT.theme();ok(themeNow()==='light'&&attrs['data-theme']==='light'&&store['lvyin-theme']==='light','one click: always light');
ok(/data-act="theme"[^>]*>☀️/.test(els.app.innerHTML),'the button shows the choice');
ACT.theme();ok(themeNow()==='dark'&&attrs['data-theme']==='dark','two clicks: always dark');
ACT.theme();ok(themeNow()==='auto'&&!('data-theme' in attrs)&&!('lvyin-theme' in store),'three clicks: back to the system, nothing stored');
store['lvyin-theme']='dark';applyTheme();ok(attrs['data-theme']==='dark','a stored choice is applied at start');
store['lvyin-theme']='purple';ok(themeNow()==='auto','an unknown value counts as following the system');
ACT.rules();ok(/data-act="theme">主题：跟随系统/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'the rules page has the switch too');
`);
