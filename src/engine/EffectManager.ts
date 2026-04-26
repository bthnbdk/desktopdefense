import { Particle, FloatingText } from '../types';

export class EffectManager {
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  public update(dt: number) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.size = Math.max(0, p.size - p.decay * dt);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public spawnExplosion(x: number, y: number, color: string, count: number = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 100 + 50;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 2,
        life: Math.random() * 0.3 + 0.2,
        maxLife: 0.5,
        decay: 10,
        active: true,
      });
    }
  }
  
  public spawnHit(x: number, y: number, color: string, count: number = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 50 + 20;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 2 + 1,
        life: Math.random() * 0.2 + 0.1,
        maxLife: 0.3,
        decay: 5,
        active: true,
      });
    }
  }

  public spawnFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      x: x + (Math.random() * 10 - 5),
      y: y + (Math.random() * 10 - 5),
      text,
      color,
      life: 0.8,
      maxLife: 0.8,
      vy: -30,
      active: true,
    });
  }
}
