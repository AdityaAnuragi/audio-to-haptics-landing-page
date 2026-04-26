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

let _uid = 0;

export default function HapticBlob({ size = 160, intensity = 0, isShortBurst = false }: Props) {
  const uid = useRef(`hb${_uid++}`).current;
  const smoothedRef = useRef(0);
  const burstRef = useRef(false);
  const prevIntensityRef = useRef(0);
  const ripplesRef = useRef<Ripple[]>([]);
  const rippleIdRef = useRef(0);
  const colorHRef = useRef(270);
  const colorSRef = useRef(65);
  const colorLRef = useRef(42);

  const cx = size / 2;
  const cy = size / 2;
  const baseR = size * 0.38;

  const prev = smoothedRef.current;
  smoothedRef.current += (intensity - prev) * (intensity > prev ? 0.4 : 0.15);
  const smoothed = smoothedRef.current;

  if (intensity > 0.1) burstRef.current = isShortBurst;
  const wasBurst = burstRef.current;

  // ripple rings on each new burst hit — plain circles, no filter
  if (intensity > 0 && prevIntensityRef.current === 0 && isShortBurst) {
    ripplesRef.current.push({ id: rippleIdRef.current++, r: baseR, opacity: 0.7 });
  }
  prevIntensityRef.current = intensity;
  ripplesRef.current = ripplesRef.current
    .map(r => ({ ...r, r: r.r + 2.5, opacity: r.opacity - 0.022 }))
    .filter(r => r.opacity > 0);

  // color: idle=purple, burst=magenta, sustained=cyan
  const tH = wasBurst && smoothed > 0.05 ? 300 : !wasBurst && smoothed > 0.05 ? 188 : 270;
  const tS = wasBurst && smoothed > 0.05 ? 95  : !wasBurst && smoothed > 0.05 ? 88  : 65;
  const tL = wasBurst && smoothed > 0.05 ? 58  : !wasBurst && smoothed > 0.05 ? 50  : 42;
  colorHRef.current += (tH - colorHRef.current) * 0.1;
  colorSRef.current += (tS - colorSRef.current) * 0.1;
  colorLRef.current += (tL - colorLRef.current) * 0.1;
  const fill = `hsl(${colorHRef.current.toFixed(1)},${colorSRef.current.toFixed(1)}%,${colorLRef.current.toFixed(1)}%)`;

  // circle materializes from hollow ring → solid as intensity rises
  const r = baseR * (1 + smoothed * 0.1);
  const strokeW = 3 + smoothed * 10;
  const fillOpacity = smoothed * 0.95;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* fake aura — two cheap transparent circles, no filter */}
      <circle cx={cx} cy={cy} r={r * 1.55} fill={fill} opacity={smoothed * 0.1} />
      <circle cx={cx} cy={cy} r={r * 1.25} fill={fill} opacity={smoothed * 0.18} />

      {/* ripple rings */}
      {ripplesRef.current.map(rip => (
        <circle
          key={rip.id}
          cx={cx} cy={cy} r={rip.r}
          fill="none"
          stroke={fill}
          strokeWidth={2}
          opacity={rip.opacity}
        />
      ))}

      {/* main circle: hollow ring at idle, solid at full intensity */}
      <circle
        cx={cx} cy={cy} r={r}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={fill}
        strokeWidth={strokeW}
      />
    </svg>
  );
}
