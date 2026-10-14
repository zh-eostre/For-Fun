# 深渊之塔

A card-battler roguelike in the browser: climb a 13-floor tower with a deck of cards, pick your path on the map
(fights, elites, campfires, shops, events), collect relics, and beat the boss at the top. Beat it and the tower
grows taller and deadlier.

Open `abyss-tower.html` in a browser to play. The run saves itself in the browser.

## Development

The page loads `style.css` and the scripts in `js/` (data, icons, run, views, main). The art lives in `art/`
(sources and licences in `art/CREDITS.md`): monster sprites are loaded as images, and the icons are built into
`js/icons.js` with `node tools/build-icons.js` whenever an SVG in `art/icons` is added or changed. Tests run with Node:

```
for f in tests/*.test.js; do node $f; done
```
