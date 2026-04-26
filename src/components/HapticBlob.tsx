import { useRef } from 'react';

interface Props {
  size?: number;
  intensity?: number;
  isShortBurst?: boolean;
}

interface Ripple {
  id: number;
  r: number;
  opacity: number;
}

function norm(a: number): number {
  return ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}

// Catmull-Rom → cubic bezier
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

let _uid = 0;

export default function HapticBlob({ size = 160, intensity = 0, isShortBurst = false }: Props) {
  const uid = useRef(`hb${_uid++}`).current;
  const smoothedRef = useRef(0);
  const burstRef = useRef(false);
  const ripplesRef = useRef<Ripple[]>([]);
  const prevIntensityRef = useRef(0);
  const rippleIdRef = useRef(0);
  const colorHRef = useRef(270);
  const colorSRef = useRef(65);
  const colorLRef = useRef(42);
  const rainbowAngleRef = useRef(0);

  const prev = smoothedRef.current;
  smoothedRef.current += (intensity - prev) * (intensity > prev ? 0.4 : 0.15);
  if (intensity > 0.1) burstRef.current = isShortBurst;

  const smoothed = smoothedRef.current;
  const burst = burstRef.current && smoothed > 0.05;

  const cx = size / 2;
  const cy = size / 2;
  const baseR = size * 0.42;

  // ripple on burst rising edge
  if (intensity > 0 && prevIntensityRef.current === 0 && isShortBurst) {
    ripplesRef.current.push({ id: rippleIdRef.current++, r: baseR, opacity: 0.85 });
  }
  prevIntensityRef.current = intensity;
  ripplesRef.current = ripplesRef.current
    .map(r => ({ ...r, r: r.r + 2.5, opacity: r.opacity - 0.022 }))
    .filter(r => r.opacity > 0);

  // color: idle=purple, burst=hot magenta, sustained=electric cyan
  const tH = burst ? 300 : smoothed > 0.05 ? 188 : 270;
  const tS = burst ? 100 : smoothed > 0.05 ? 90 : 65;
  const tL = burst ? 60 : smoothed > 0.05 ? 50 : 42;
  const cf = 0.1;
  colorHRef.current += (tH - colorHRef.current) * cf;
  colorSRef.current += (tS - colorSRef.current) * cf;
  colorLRef.current += (tL - colorLRef.current) * cf;
  const fill = `hsl(${colorHRef.current.toFixed(1)},${colorSRef.current.toFixed(1)}%,${colorLRef.current.toFixed(1)}%)`;

  // rainbow stroke rotates, faster at high intensity
  rainbowAngleRef.current = (rainbowAngleRef.current + 1.2 + smoothed * 6) % 360;

  // glow strength scales with intensity
  const glowDev = (smoothed * 14).toFixed(1);

  // shape: burst=5-point star, sustained=smooth swelling circle
  const spikes = burst
    ? Array.from({ length: 5 }, (_, i) => ({
        a: norm((i / 5) * 2 * Math.PI - Math.PI / 2),
        h: 1.0,
        k: 20,
      }))
    : [];
  const multiplier = burst ? 1.3 : 0;
  const sustainSwell = burst ? 0 : smoothed * 0.28;

  const pts = Array.from({ length: 90 }, (_, i) => {
    const angle = (i / 90) * 2 * Math.PI;
    const weight = spikes.reduce((sum, s) => {
      const diff = Math.min(Math.abs(angle - s.a), 2 * Math.PI - Math.abs(angle - s.a));
      return sum + s.h * Math.exp(-s.k * diff * diff);
    }, 0);
    const r = baseR * (1 + smoothed * Math.min(weight, 1) * multiplier + sustainSwell);
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
      <defs>
        <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={glowDev} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient
          id={`${uid}-rainbow`}
          gradientUnits="userSpaceOnUse"
          x1={cx} y1={cy - baseR}
          x2={cx} y2={cy + baseR}
          gradientTransform={`rotate(${rainbowAngleRef.current.toFixed(1)}, ${cx}, ${cy})`}
        >
          <stop offset="0%"   stopColor="#ff0080" />
          <stop offset="20%"  stopColor="#ff8c00" />
          <stop offset="40%"  stopColor="#faff00" />
          <stop offset="60%"  stopColor="#00ff88" />
          <stop offset="80%"  stopColor="#00c3ff" />
          <stop offset="100%" stopColor="#ff0080" />
        </linearGradient>
      </defs>

      {ripplesRef.current.map(rip => (
        <circle
          key={rip.id}
          cx={cx}
          cy={cy}
          r={rip.r}
          fill="none"
          stroke={fill}
          strokeWidth={3}
          opacity={rip.opacity}
          filter={`url(#${uid}-glow)`}
        />
      ))}

      <path
        d={smoothPath(pts)}
        fill={fill}
        stroke={`url(#${uid}-rainbow)`}
        strokeWidth={Math.min(smoothed * 10, 5)}
        filter={`url(#${uid}-glow)`}
      />
    </svg>
  );
}
