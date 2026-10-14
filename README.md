# 深渊之塔

A card-battler roguelike in the browser: climb a 13-floor tower with a deck of cards, pick your path on the map
(fights, elites, campfires, shops, events), collect relics, and beat the boss at the top. Beat it and the tower
grows taller and deadlier.

Open `abyss-tower.html` in a browser to play. The run saves itself in the browser.

## Development

The page loads `style.css` and the scripts in `js/` (data, run, views, main). Tests run with Node:

```
for f in tests/*.test.js; do node $f; done
```
