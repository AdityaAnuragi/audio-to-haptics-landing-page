import { useRef, useEffect, useState, type ChangeEvent } from 'react';
import { HapticEngine, DEFAULT_OPTIONS } from 'audio-to-haptics';
import type { HapticOptions } from 'audio-to-haptics';

const DEFAULT_SRC = '/HeartBeatNew.mp4';

const SLIDERS = [
  {
    key: 'spikeRatio' as const,
    label: 'Spike sensitivity',
    desc: 'Threshold vs. recent audio — lower = more haptics, higher = strong spikes only.',
    min: 1.0, max: 3.0, step: 0.1,
  },
  {
    key: 'sustainLowerBound' as const,
    label: 'Sustain decay tolerance',
    desc: 'Decay tolerance — lower = longer tails, higher = chains cut off sooner.',
    min: 0.5, max: 1.0, step: 0.05,
  },
  {
    key: 'shortChainBuckets' as const,
    label: 'Burst threshold',
    desc: 'Chains shorter than this → solid MAX pulse (red). Longer → PWM intensity (blue). Lower = more PWM, higher = more solid bursts.',
    min: 1, max: 10, step: 1,
  },
  {
    key: 'intensityFloor' as const,
    label: 'Intensity floor',
    desc: 'Minimum duty cycle while vibrating — prevents motor stall on quiet audio. Lower = weaker minimum, higher = stronger minimum buzz.',
    min: 0.3, max: 0.9, step: 0.05,
  },
  {
    key: 'sustainUpperBound' as const,
    label: 'Sustain rise tolerance',
    desc: 'How much a chain can rise and still sustain — higher = longer chains on building audio, lower = only decaying tails sustain.',
    min: 1.0, max: 2.0, step: 0.1,
  },
] as const;

type SliderKey = typeof SLIDERS[number]['key'];
type SliderValues = Pick<HapticOptions, SliderKey>;
type PresetKey = 'default' | 'smooth' | 'punchy' | 'selective' | 'custom';

const DEFAULT_VALS: SliderValues = {
  spikeRatio: DEFAULT_OPTIONS.spikeRatio,
  sustainLowerBound: DEFAULT_OPTIONS.sustainLowerBound,
  shortChainBuckets: 6,
  intensityFloor: DEFAULT_OPTIONS.intensityFloor,
  sustainUpperBound: DEFAULT_OPTIONS.sustainUpperBound,
};

const PRESETS: { key: PresetKey; label: string; vals: SliderValues | null }[] = [
  { key: 'default',   label: 'Default',   vals: DEFAULT_VALS },
  { key: 'smooth',    label: 'Smooth',    vals: { spikeRatio: 1.1, sustainLowerBound: 0.5,  shortChainBuckets: 1, intensityFloor: 0.50, sustainUpperBound: 1.5 } },
  { key: 'punchy',    label: 'Punchy',    vals: { spikeRatio: 1.5, sustainLowerBound: 0.85, shortChainBuckets: 8, intensityFloor: 0.65, sustainUpperBound: 1.01 } },
  { key: 'selective', label: 'Selective', vals: { spikeRatio: 2.8, sustainLowerBound: 0.9,  shortChainBuckets: 5, intensityFloor: 0.55, sustainUpperBound: 1.01 } },
  { key: 'custom',    label: 'Custom',    vals: null },
];

interface VizData {
  trends: { max: number }[];
  vibrationMap: boolean[];
  chainIntensity: number[];
  chainIsBurst: boolean[];
  durationSeconds: number;
}

export default function Playground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<HapticEngine | null>(null);
  const cachedBuffer = useRef<ArrayBuffer | null>(null);
  const vizRef = useRef<VizData>({ trends: [], vibrationMap: [], chainIntensity: [], chainIsBurst: [], durationSeconds: 0 });
  const playheadRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [vals, setVals] = useState<SliderValues>(DEFAULT_VALS);
  const [preset, setPreset] = useState<PresetKey>('default');
  const [videoSrc, setVideoSrc] = useState(DEFAULT_SRC);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [urlInput, setUrlInput] = useState('');

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { trends, vibrationMap, chainIntensity, chainIsBurst, durationSeconds } = vizRef.current;
    if (!trends.length) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    if (canvas.width !== Math.round(W * dpr)) canvas.width = Math.round(W * dpr);
    if (canvas.height !== Math.round(H * dpr)) canvas.height = Math.round(H * dpr);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const waveH = H * 0.54;
    const chainY = H * 0.64;
    const chainH = H * 0.28;
    const bucketW = W / trends.length;

    // Waveform bars
    const peak = trends.reduce((m, t) => Math.max(m, t.max), 0.001);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < trends.length; i++) {
      const barH = Math.max(1, (trends[i].max / peak) * waveH);
      ctx.fillRect(i * bucketW, waveH - barH, Math.max(0.5, bucketW - 0.5), barH);
    }

    // Divider
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fillRect(0, H * 0.6, W, 1);

    // Chain blocks
    for (let i = 0; i < vibrationMap.length; i++) {
      if (!vibrationMap[i]) continue;
      const alpha = 0.4 + Math.min(1, chainIntensity[i] ?? 0.5) * 0.5;
      ctx.fillStyle = chainIsBurst[i]
        ? `rgba(239, 68, 68, ${alpha})`
        : `rgba(59, 130, 246, ${alpha})`;
      ctx.fillRect(i * bucketW, chainY, Math.max(0.5, bucketW - 0.5), chainH);
    }

    // Playhead
    if (durationSeconds > 0 && playheadRef.current > 0) {
      const x = (playheadRef.current / durationSeconds) * W;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(x - 0.75, 0, 1.5, H);
    }

    // Labels
    ctx.font = '10px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillText('WAVEFORM', 8, 13);
    ctx.fillText('HAPTICS', 8, chainY + 13);

    ctx.restore();
  }

  async function runAnalysis(buf: ArrayBuffer, opts: SliderValues) {
    const engine = new HapticEngine(opts);
    await engine.analyzeBuffer(buf);

    if (engineRef.current) engineRef.current.detach();
    engine.attach(videoRef.current!, (time) => {
      playheadRef.current = time;
      draw();
    });
    engineRef.current = engine;

    const rawTrends = engine.trends as { max: number }[];
    const vibrationMap = [...engine.vibrationMap];
    const chainLength = [...engine.chainLength];
    const chainIntensity = [...engine.chainIntensity];
    const chainIsBurst = chainLength.map(l => l < opts.shortChainBuckets);
    const durationSeconds = rawTrends.length * (engine.opts.bucketSize / engine.sampleRate);

    vizRef.current = { trends: rawTrends, vibrationMap, chainIntensity, chainIsBurst, durationSeconds };
    draw();
  }

  async function loadAudio(url: string, opts: SliderValues) {
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      cachedBuffer.current = buf.slice(0);
      await runAnalysis(buf, opts);
      setVideoSrc(url);
      setStatus('ready');
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Failed to load');
    }
  }

  useEffect(() => {
    void loadAudio(DEFAULT_SRC, vals);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  function handlePreset(p: typeof PRESETS[number]) {
    setPreset(p.key);
    if (!p.vals) return;
    const newVals = p.vals;
    setVals(newVals);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!cachedBuffer.current) return;
      await runAnalysis(cachedBuffer.current.slice(0), newVals);
    }, 300);
  }

  function handleSlider(key: SliderKey, raw: string) {
    setPreset('custom');
    const value = parseFloat(raw);
    const newVals = { ...vals, [key]: value };
    setVals(newVals);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!cachedBuffer.current) return;
      await runAnalysis(cachedBuffer.current.slice(0), newVals);
    }, 300);
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void loadAudio(URL.createObjectURL(file), vals);
  }

  function handleUrlLoad() {
    const url = urlInput.trim();
    if (!url) return;
    setUrlInput('');
    void loadAudio(url, vals);
  }

  return (
    <div>
      <video
        ref={videoRef}
        src={videoSrc}
        controls
        playsInline
        style={{ width: '100%', borderRadius: 10, marginBottom: 16, background: '#000', display: 'block' }}
      />

      {/* Visualization */}
      <div style={{ position: 'relative', background: '#0f0f0f', borderRadius: 10, height: 110, marginBottom: 10, overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
        {status === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
            Analyzing…
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 36, paddingLeft: 2 }}>
        <span style={{ fontSize: 12, color: '#777', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(239,68,68,0.9)', display: 'inline-block', flexShrink: 0 }} />
          Short burst
        </span>
        <span style={{ fontSize: 12, color: '#777', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(59,130,246,0.9)', display: 'inline-block', flexShrink: 0 }} />
          Sustained
        </span>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => handlePreset(p)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: preset === p.key ? '1.5px solid #7c3aed' : '1.5px solid #ddd',
              background: preset === p.key ? '#7c3aed' : '#fff',
              color: preset === p.key ? '#fff' : '#555',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >{p.label}</button>
        ))}
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginBottom: 52 }}>
        {SLIDERS.map(({ key, label, desc, min, max, step }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{label}</label>
              <span style={{ fontSize: 13, color: '#666', fontVariantNumeric: 'tabular-nums', marginLeft: 12 }}>{vals[key]}</span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#666', lineHeight: 1.45 }}>{desc}</p>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={vals[key]}
              onChange={e => handleSlider(key, e.target.value)}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        ))}
      </div>

      {/* Custom input */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.09)', paddingTop: 28 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#444', margin: '0 0 4px' }}>Try your own audio or video</p>
        <p style={{ fontSize: 12, color: '#999', margin: '0 0 14px' }}>Direct URLs only — YouTube and streaming services won't work.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', padding: '9px 16px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#444', cursor: 'pointer', background: '#fff', whiteSpace: 'nowrap' }}>
            Upload file
            <input type="file" accept="audio/*,video/*" onChange={handleFile} style={{ display: 'none' }} />
          </label>
          <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
            <input
              type="url"
              placeholder="https://example.com/audio.mp3"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUrlLoad()}
              style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 13, outline: 'none', minWidth: 0, background: '#fff' }}
            />
            <button
              onClick={handleUrlLoad}
              style={{ padding: '9px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Load
            </button>
          </div>
        </div>
        {status === 'error' && (
          <p style={{ color: '#c00', fontSize: 13, margin: '10px 0 0' }}>{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
