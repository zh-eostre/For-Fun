# 深渊之塔

A card-battler roguelike in the browser: pick one of five heroes (骑士, 刺客, 灰烬术士, 狂战士, 驯兽师), each with their own HP,
starting deck and relic, and climb a 13-floor tower with a deck of cards, pick your path on the map
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

To check the balance after changing numbers, a bot plays the game many times and reports how far runs get, what each
fight costs, and how much each card and relic is worth (runs that start with it against runs that start without):

```
node tools/balance.js 1000 overall fights      # quick: difficulty, every encounter
node tools/balance.js 1000 cards relics        # slow: every card and relic, a thousand runs each
node tools/balance.js 1000 cards toad raven     # only the cards (or relics) named
```

The bot plays sensibly but not like a person, so read the numbers as comparisons between cards, fights and rounds,
not as how hard the game is for you. A card worth anything only alongside others (余烬, 吞噬, 剧毒) looks weaker in
these tests than it is.
