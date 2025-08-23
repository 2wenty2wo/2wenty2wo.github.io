// src/maps/roadMap.js
// Generates a simple grid of roads for the GameScene.

export function generateRoadMap(scene, opts = {}) {
  const tileSize = opts.tileSize ?? 64;
  const width = opts.width ?? 200;
  const height = opts.height ?? 200;
  const seed = opts.seed ?? 1;

  // Create a blank tilemap and layer
  const map = scene.make.tilemap({ tileWidth: tileSize, tileHeight: tileSize, width, height });
  const roads = map.addTilesetImage('roads');
  const layer = map.createBlankLayer('roads', roads, 0, 0);
  layer.setDepth(0);

  const roadFirst = roads.firstgid;
  const isRoad = (wx, wy) => ((wy + seed) % 20 === 5 || (wx + seed) % 20 === 10);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (isRoad(x, y)) {
        let mask = 0;
        if (isRoad(x, y - 1)) mask |= 1; // up
        if (isRoad(x + 1, y)) mask |= 2; // right
        if (isRoad(x, y + 1)) mask |= 4; // down
        if (isRoad(x - 1, y)) mask |= 8; // left
        const tile = roadFirst + mask;
        layer.putTileAt(tile, x, y);
      }
    }
  }

  return { map, layer, width, height, tileSize };
}

