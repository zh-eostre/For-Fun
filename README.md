# 绿茵经理

A single-player football manager that runs in the browser. Open `football-manager.html` (double-click works; no server needed).

- Progress is saved automatically in the browser. Use 导出 on the club page to write a save file; in Chrome or Edge it can go straight into the `saves/` folder.
- Game code is in `js/` (loaded in the order listed in `football-manager.html`), styles in `style.css`.
- Most tuning numbers (injury rates, training, prizes, facility costs, names) are in `js/data.js`.

## Tests

```
node tests/run.js
```

Each `tests/*.test.js` loads the game into a sandbox and plays it headlessly (seasons, transfers, loans, saves, and so on).
