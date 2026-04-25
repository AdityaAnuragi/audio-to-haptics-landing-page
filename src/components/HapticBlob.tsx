interface Props {
  size?: number;
}

function norm(a: number): number {
  return ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}

// Catmull-Rom → cubic bezier: curve passes *through* every point with smooth tangents at each join
function smoothPath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d + ' Z';
}

export default function HapticBlob({ size = 160 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const baseR = size * 0.42;

  // --- hardcoded burst for now ---
  const intensity = 1
  // --------------------------------

  const TOP = norm(-Math.PI / 2); // 3π/2 — "up" in SVG coords
  const EAR = 42 * Math.PI / 180; // 42° offset from top for each ear

  // Two ear peaks + a small centre bridge, each defined as a gaussian spike
  const spikes = [
    { a: norm(TOP - EAR), h: 1.0 }, // left ear
    { a: norm(TOP + EAR), h: 1.0 }, // right ear
    { a: TOP,             h: 0.25 }, // slight bridge between ears
  ];

  // 90 evenly-spaced points — fine enough that bezier stays smooth throughout
  const pts = Array.from({ length: 90 }, (_, i) => {
    const angle = (i / 90) * 2 * Math.PI;
    const weight = spikes.reduce((sum, s) => {
      const diff = Math.min(Math.abs(angle - s.a), 2 * Math.PI - Math.abs(angle - s.a));
      return sum + s.h * Math.exp(-15 * diff * diff);
    }, 0);
    const r = baseR * (1 + intensity * Math.min(weight, 1) * 1.1);
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      <path d={smoothPath(pts)} fill="#7c3aed" />
    </svg>
  );
}
