// Copies the game (page, styles, scripts, sounds) into desktop/app/ for the desktop build, with its Google Fonts
// downloaded so the app looks the same without a network. The web version in the project root keeps loading the fonts from Google.
// Fonts are cached in desktop/.font-cache, so only the first run needs a connection.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..'),out=path.join(__dirname,'app'),cache=path.join(__dirname,'.font-cache');
// a current browser's user agent, so Google serves woff2 files split by character range (the page only loads the
// pieces it needs)
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

function copy(rel){
  const from=path.join(root,rel),to=path.join(out,rel);
  if(fs.statSync(from).isDirectory()){fs.mkdirSync(to,{recursive:true});fs.readdirSync(from).forEach(f=>copy(path.join(rel,f)))}
  else fs.copyFileSync(from,to);
}

async function get(url,binary){
  const r=await fetch(url,{headers:{'User-Agent':UA}});
  if(!r.ok)throw new Error(url+': '+r.status);
  return binary?Buffer.from(await r.arrayBuffer()):r.text();
}

// fonts.css and the font files it points to, from the cache or from Google
async function fonts(href){
  fs.mkdirSync(cache,{recursive:true});
  const key=crypto.createHash('sha1').update(href).digest('hex').slice(0,12),cssFile=path.join(cache,key+'.css');
  let css=fs.existsSync(cssFile)?fs.readFileSync(cssFile,'utf8'):null;
  if(!css){css=await get(href);fs.writeFileSync(cssFile,css)}
  const urls=[...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)'"]+/g)||[])];
  const name=u=>crypto.createHash('sha1').update(u).digest('hex').slice(0,16)+path.extname(new URL(u).pathname);
  const todo=urls.filter(u=>!fs.existsSync(path.join(cache,name(u))));
  for(let i=0;i<todo.length;i+=16)  // sixteen at a time
    await Promise.all(todo.slice(i,i+16).map(async u=>fs.writeFileSync(path.join(cache,name(u)),await get(u,true))));
  fs.mkdirSync(path.join(out,'fonts'),{recursive:true});
  urls.forEach(u=>fs.copyFileSync(path.join(cache,name(u)),path.join(out,'fonts',name(u))));
  fs.writeFileSync(path.join(out,'fonts.css'),urls.reduce((c,u)=>c.split(u).join('fonts/'+name(u)),css));
  return urls.length;
}

(async()=>{
  fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
  ['football-manager.html','style.css','js','sounds'].forEach(copy);
  const page=path.join(out,'football-manager.html');let html=fs.readFileSync(page,'utf8');
  const href=(html.match(/<link href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/)||[])[1];
  if(href){
    try{
      const n=await fonts(href.replace(/&amp;/g,'&'));
      html=html.replace(/<link rel="preconnect"[^>]*>\n?/g,'').replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/,'<link rel="stylesheet" href="fonts.css">');
      fs.writeFileSync(page,html);
      console.log(`game copied to desktop/app, ${n} font files bundled`);
    }catch(e){console.warn('fonts not bundled (no connection?), the app will use them online when it can: '+e.message)}
  }else console.log('game copied to desktop/app');
})().catch(e=>{console.error(e);process.exit(1)});
