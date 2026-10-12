# 绿茵经理 · 桌面版

把网页版游戏包成可以双击打开的电脑程序（用 [Electron](https://www.electronjs.org/)）。游戏代码不用改：
`prepare.js` 会在每次启动或打包前，把根目录的 `football-manager.html`、`style.css` 和 `js/` 复制到 `desktop/app/`，
并把 Google Fonts 字体下载下来一起打包，所以没网也能正常显示。

## 直接下载（推荐）

每次往 `football-manager` 分支推送游戏或桌面版的改动，GitHub 都会自动打包 Windows 版：

1. 打开仓库的 **Actions** 页面，点最新一次 **桌面版打包**。
2. 拉到底部 **Artifacts**，下载 `LvYinJingLi-windows`（一个 zip，保留 90 天）。
3. 解压后有两个文件：
   - `LvYinJingLi-1.0.0-portable.exe`：便携版，双击就能玩；
   - `LvYinJingLi-Setup-1.0.0.exe`：安装版，会建桌面快捷方式。

第一次打开时，Windows 可能提示「Windows 已保护你的电脑」（因为程序没有付费签名），点 **更多信息 → 仍要运行** 即可。

## 自己在电脑上打包

需要 Node.js（18 以上）。在 `desktop` 文件夹里：

```sh
npm install          # 第一次需要
npm start            # 直接开一个窗口试玩
npm run dist:win     # 打包 Windows 版（在 Mac 上也可以），输出到 desktop/dist/
npm run dist:mac     # 打包 Mac 版 .dmg
```

改版本号：修改 `package.json` 里的 `version`。换图标：替换 `build/icon.png`（512×512 的 PNG）。

## 小提示

- **F11**：全屏 / 退出全屏。
- 存档保存在电脑的用户资料夹里（Windows 是 `%APPDATA%\绿茵经理`），关掉再开还在；「存档文件」里的导出、导入照常可用。
- 网页版和桌面版的存档是分开的，可以用导出 / 导入在两边之间搬。
