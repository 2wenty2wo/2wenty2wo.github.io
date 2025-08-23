// src/maps/roadMap.js
// Generates a chunk of grass with overlayed roads using bitmasking.
import { GAME_CONFIG } from '../config.js';

export function createRoadChunk(scene, cx, cy) {
  const tilesetMeta = scene.cache.json.get('roads_tileset');
  const tileSize = tilesetMeta.tilewidth;
  const chunkSize = GAME_CONFIG.world.chunkSize;

  const map = scene.make.tilemap({ tileWidth: tileSize, tileHeight: tileSize, width: chunkSize, height: chunkSize });

  const grass = map.addTilesetImage('grass');
  const roads = map.addTilesetImage('roads_tileset', 'roads');

  const x = cx * chunkSize * tileSize;
  const y = cy * chunkSize * tileSize;

  const grassLayer = map.createBlankLayer('grass', grass, x, y);
  grassLayer.fill(grass.firstgid);
  grassLayer.setCollision(grass.firstgid);

  const roadLayer = map.createBlankLayer('roads', roads, x, y);

  const offset = GAME_CONFIG.world.seed;
  const isRoad = (wx, wy) => ((wy + offset) % 20 === 5 || (wx + offset) % 20 === 10);

  for (let tx = 0; tx < chunkSize; tx++) {
    for (let ty = 0; ty < chunkSize; ty++) {
      const worldX = cx * chunkSize + tx;
      const worldY = cy * chunkSize + ty;

      if (isRoad(worldX, worldY)) {
        let mask = 0;
        if (isRoad(worldX, worldY - 1)) mask |= 1; // up
        if (isRoad(worldX + 1, worldY)) mask |= 2; // right
        if (isRoad(worldX, worldY + 1)) mask |= 4; // down
        if (isRoad(worldX - 1, worldY)) mask |= 8; // left
        const tile = roads.firstgid + mask;
        roadLayer.putTileAt(tile, tx, ty);
        grassLayer.removeTileAt(tx, ty);
      }
    }
  }

  return { map, grassLayer, roadLayer };
}
