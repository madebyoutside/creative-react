import type p5 from 'p5';
import type { SketchDefinition } from '../p5/createSketch';

const PARTICLES = 900;
const TRAIL = 14;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Particles drifting through a noise field, pushed around by the pointer. */
export function flowField(readSize: () => { width: number; height: number }): SketchDefinition {
  const particles: Particle[] = [];

  const seed = (p: p5) => {
    particles.length = 0;
    for (let i = 0; i < PARTICLES; i += 1) {
      particles.push({ x: p.random(p.width), y: p.random(p.height), vx: 0, vy: 0 });
    }
  };

  return {
    readSize,

    setup: (p: p5) => {
      const initial = readSize();
      p.createCanvas(Math.max(1, initial.width), Math.max(1, initial.height));
      seed(p);

      return () => {
        p.background(12, 12, 14, TRAIL);
        p.noStroke();
        const pointer = p.mouseX > 0 && p.mouseY > 0;
        const reach = 140;

        for (const particle of particles) {
          const angle = p.noise(particle.x * 0.0025, particle.y * 0.0025) * p.TWO_PI * 2;
          particle.vx += Math.cos(angle) * 0.08;
          particle.vy += Math.sin(angle) * 0.08;

          if (pointer) {
            const dx = particle.x - p.mouseX;
            const dy = particle.y - p.mouseY;
            const distance = Math.hypot(dx, dy);
            if (distance < reach && distance > 0.001) {
              const push = (1 - distance / reach) * 2.4;
              particle.vx += (dx / distance) * push;
              particle.vy += (dy / distance) * push;
            }
          }

          particle.vx *= 0.94;
          particle.vy *= 0.94;
          particle.x = (particle.x + particle.vx + p.width) % p.width;
          particle.y = (particle.y + particle.vy + p.height) % p.height;
          const speed = Math.min(1, Math.hypot(particle.vx, particle.vy) / 3);
          p.stroke(232, 98 + speed * 110, 42 + speed * 90, 90 + speed * 120);
          p.point(particle.x, particle.y);
        }
      };
    },

    onResize: (p: p5) => {
      p.background(12, 12, 14);
      seed(p);
    },

    description: 'Particles drifting through a noise field, pushed around by the pointer.',
  };
}
