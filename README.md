# Instagib2

A browser-based multiplayer instagib FPS — Quake 3 Arena's **Q3DM17 ("The Longest Yard")** rebuilt in WebGL with [Three.js](https://threejs.org/).

One weapon, one shot, one kill: everyone gets a railgun and infinite ammo. Jump pads, strafe jumping and bunny hopping included. Runs directly in the browser, no install needed.

## Features

- Faithful Q3DM17 map geometry, loaded as glTF with a separate collision mesh
- Quake 3 movement physics ported from `bg_pmove.c` — ground friction, air acceleration, strafe jumping and bunny hopping work like in the original
- Multiplayer over WebSockets with rooms, scoreboard and death spectator cam
- Railgun with rail trail effect, hit detection and gib sounds
- Jump pads, teleporters and powerups
- Capsule-vs-octree collision detection against the level mesh
- Mobile touch controls (experimental)

## Getting started

```
npm install
npm start
```

Then open http://localhost:8080, pick a name, room and color, and play.

### Production

```
NODE_ENV=production node server.js
```

In production mode the server listens on port 443 with HTTPS (expects Let's Encrypt certificates, see `server.js`) and serves the webpack bundle from `dist/` instead of the raw modules from `src/`. Build the bundle with:

```
npx webpack
```

Optional environment variables: `PORT` (override port), `USE_BASIC_AUTH=true` (protect the site with basic auth).

## Controls

| Input | Action |
|---|---|
| Mouse | Look (click once to grab the pointer) |
| Left click | Shoot |
| Right click (hold) | Zoom |
| W A S D | Move |
| Space | Jump |
| Q (hold) | Scoreboard |
| P | Spectate a random player |
| K | Suicide |

The browser console offers `sensitivity(500)` (higher is slower), `volume(0.4)` and `fov(75)`.

## Rooms

Players in the same room play together. Rooms are created on demand from the name entered on the start screen; the default room is `TheLongestYard`. Ending a room name with a digit limits its player count (e.g. `duel2` allows 2 players). `GET /rooms` returns the public rooms as JSON.

## Project layout

```
server.js          Node.js game server: Express + ws, rooms, position broadcast (~60 Hz)
src/               Client as ES modules (served directly in development)
  main.js          Entry point and game loop
  Player.js        Movement physics (Quake 3 style), collision response
  networking.js    WebSocket protocol, enemy interpolation
  collisions.js    World, trigger, player and powerup collision checks
  railgun.js/rail.js  Shooting and rail trail rendering
  lib/CustomOctree.js  Octree used for world and trigger collision
  models/q3dm17.js Map entities (spawn points, jump pads, triggers)
  three/           Vendored Three.js
web/               Static assets: HTML, CSS, map glTF, player model, sounds
webpack.config.js  Production bundle configuration
```

`web/edit.html` is an experimental in-browser level editor and `web/upload.html` a helper for testing custom sounds.

## License

Copyright Raymond Hulha, licensed under the [GNU Affero General Public License](https://www.gnu.org/licenses/agpl-3.0.en.html).
