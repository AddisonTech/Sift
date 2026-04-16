import type { VerdictType, ItemCategory, UserPreferences } from './types';

export function verdictColor(verdict: VerdictType): string {
  switch (verdict) {
    case 'Buy':
      return '#00E676';
    case 'Go':
      return '#00D1FF';
    case 'Watch':
      return '#FFB300';
    case 'Skip':
      return '#FF3D71';
    case 'Pass':
      return '#FF3D71';
  }
}

export function verdictLabel(category: ItemCategory, verdict: VerdictType): string {
  return verdict;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(v).toString(16).padStart(2, '0'))
      .join('')
  );
}

export function scoreColor(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped <= 50) {
    const t = clamped / 50;
    const from = hexToRgb('#FF3D71');
    const to = hexToRgb('#FFB300');
    return rgbToHex(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
    );
  } else {
    const t = (clamped - 50) / 50;
    const from = hexToRgb('#FFB300');
    const to = hexToRgb('#00E676');
    return rgbToHex(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
    );
  }
}

export function formatDistance(km: number): string {
  const miles = km * 0.621371;
  return `${miles.toFixed(1)} mi`;
}

export function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
}

export function defaultPreferences(): UserPreferences {
  return {
    price_weight: 6,
    quality_weight: 7,
    ethics_weight: 3,
    health_weight: 5,
    speed_weight: 5,
    dietary: [],
    budget: 'mid',
    distance_radius_km: 8,
    avoid_chains: false,
  };
}
