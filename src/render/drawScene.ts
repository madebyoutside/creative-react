import type p5 from "p5";
import type { Scene } from "../effects/types";

export function drawSceneWithP5(
  target: p5 | p5.Graphics,
  scene: Scene,
  scale = 1,
): void {
  target.background(
    scene.background.r,
    scene.background.g,
    scene.background.b,
  );
  target.noStroke();
  target.fill(scene.dot.r, scene.dot.g, scene.dot.b);

  for (const dot of scene.circles) {
    target.circle(dot.x * scale, dot.y * scale, dot.radius * 2 * scale);
  }
}

export function renderSceneToGraphics(
  p: p5,
  scene: Scene,
  scale: number,
): p5.Graphics {
  const buffer = p.createGraphics(
    Math.max(1, Math.round(scene.width)),
    Math.max(1, Math.round(scene.height)),
  );
  buffer.pixelDensity(scale);
  drawSceneWithP5(buffer, scene);
  return buffer;
}
