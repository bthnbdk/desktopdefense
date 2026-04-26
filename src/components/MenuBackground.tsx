import React from 'react';
import { themes } from '../data/themes';
import { useHudStore } from '../store';
import type { TowerType, EnemyType } from '../types';

const DISPLAY_TOWERS: TowerType[] = ['pellet', 'splash', 'slow', 'sniper', 'chain', 'mortar'];
const ENEMY_TYPES: EnemyType[] = ['normal', 'fast', 'flying', 'boss', 'immune', 'spawn', 'group'];

interface Drifter {
  id: number;
  type: 'tower' | 'enemy';
  subtype: TowerType | EnemyType;
  top: number;   // % from top
  size: number;  // px
  duration: number; // seconds for full traverse
  delay: number;    // animation delay
  direction: 'ltr' | 'rtl';
}

function buildDrifters(): Drifter[] {
  const items: Drifter[] = [];
  let id = 0;

  // Scatter ~20 items across the viewport
  for (let i = 0; i < 12; i++) {
    const isTower = i % 3 !== 0; // 2/3 towers, 1/3 enemies
    items.push({
      id: id++,
      type: isTower ? 'tower' : 'enemy',
      subtype: isTower
        ? DISPLAY_TOWERS[i % DISPLAY_TOWERS.length]
        : ENEMY_TYPES[i % ENEMY_TYPES.length],
      top: 5 + (i * 7.5) % 90, // spread vertically
      size: 14 + (i % 3) * 8,
      duration: 60 + (i * 17) % 80,      // 60–140s, varied
      delay: -(i * 7),                    // staggered start
      direction: i % 2 === 0 ? 'ltr' : 'rtl',
    });
  }
  return items;
}

const drifters = buildDrifters();

const TOWER_SHAPES: Record<TowerType, React.CSSProperties> = {
  pellet:    { borderRadius: '2px' },
  splash:    { borderRadius: '50%' },
  slow:      { clipPath: 'polygon(50% 0%, 100% 40%, 82% 100%, 18% 100%, 0% 40%)' },
  sniper:    { clipPath: 'polygon(50% 0%, 100% 40%, 82% 100%, 18% 100%, 0% 40%)' },
  chain:     { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' },
  mortar:    { borderRadius: '2px', width: '120%', height: '120%' },
};

const ENEMY_SHAPES: Record<EnemyType, React.CSSProperties> = {
  normal:    { borderRadius: '50%' },
  fast:      { borderRadius: '50%' },
  boss:      { borderRadius: '2px', transform: 'rotate(45deg)' },
  group:     { borderRadius: '50%' },
  immune:    { borderRadius: '50%', border: '1px solid currentColor', background: 'transparent' },
  spawn:     { borderRadius: '30%' },
  flying:    { clipPath: 'polygon(50% 0%, 100% 60%, 75% 100%, 25% 100%, 0% 60%)' },
};

export const MenuBackground: React.FC = () => {
  const theme = themes[useHudStore((s) => s.activeTheme)];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {drifters.map((d) => {
        const isTower = d.type === 'tower';
        const color = isTower
          ? theme.towerColors[d.subtype as TowerType]
          : theme.enemyColors[d.subtype as EnemyType];
        const shapeStyle = isTower
          ? TOWER_SHAPES[d.subtype as TowerType]
          : ENEMY_SHAPES[d.subtype as EnemyType];

        return (
          <div
            key={d.id}
            className="absolute"
            style={{
              top: `${d.top}%`,
              width: d.size,
              height: d.size,
              opacity: 0.06,
              backgroundColor: isTower ? color : undefined,
              color,
              animation: `${d.direction === 'ltr' ? 'drift-ltr' : 'drift-rtl'} ${d.duration}s linear infinite`,
              animationDelay: `${d.delay}s`,
              ...shapeStyle,
            }}
          />
        );
      })}

    </div>
  );
};
