# 晴川小镇

像素风城镇经营小游戏：从一座市政厅开始铺路、盖房、熬过冬天，把拓荒地发展成繁华之城。

双击 `index.html` 就能玩，不需要安装或构建。存档保存在浏览器的 localStorage 里（键名 `qingchuan-town-v1`）。

## 文件

```
index.html        页面骨架
css/style.css     样式
icons/            网页图标（市政厅像素画）
js/config.js      数值：建筑、等级、任务、交易
js/state.js       全局状态、工具函数、存读档
js/map.js         地图生成
js/setup.js       开局选地图
js/sim.js         每日模拟：产出、幸福度、人口、季节、事件
js/actions.js     放置和拆除
js/sprites.js     像素画
js/render.js      画布绘制
js/ui.js          界面
js/main.js        输入和主循环
```

这些脚本是普通的 `<script>`，共用全局变量，所以加载顺序很重要：`config.js` 最先，`main.js` 最后。新加文件时记得在 `index.html` 里按顺序放好。
