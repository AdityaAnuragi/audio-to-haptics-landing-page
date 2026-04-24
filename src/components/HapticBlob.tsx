interface Props {
  size?: number;
}

export default function HapticBlob({ size = 160 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      <circle cx={cx} cy={cy} r={r} fill="#7c3aed" />
    </svg>
  );
}
