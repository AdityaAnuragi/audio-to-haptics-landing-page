import { useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { useHaptics } from 'audio-to-haptics/react';
import type { HapticOptions } from 'audio-to-haptics';
import { currentVideo } from '../store';
import HapticBlob from './HapticBlob';

interface Props {
  src: string;
  title: string;
  credit: string;
  creditUrl: string;
  opts?: Partial<HapticOptions>;
}

export default function VideoExample({ src, title, credit, creditUrl, opts }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { analyze, loading, error, ready, engine, playbackBucketIntensity, playbackChainIsShortBurst } = useHaptics(videoRef, opts);
  const playing = useStore(currentVideo);

  useEffect(() => { void analyze(src); }, []);

  useEffect(() => {
    if (!ready) return;
    const vm = engine.vibrationMap;
    const ci = engine.chainIntensity;
    const cl = engine.chainLength;
    const ce = engine.chainEndTime;
    const trends = engine.trends;
    const { shortChainBuckets, cycleMs, intensityFloor } = engine.opts;

    console.group(`[${title}] chain map`);
    let i = 0;
    while (i < vm.length) {
      if (!vm[i]) { i++; continue; }
      const len      = cl[i];
      const startT   = trends[i].startTime.toFixed(2);
      const endT     = ce[i].toFixed(2);
      const rawPct   = Math.round(ci[i] * 100);
      const effI     = Math.max(ci[i], intensityFloor);
      const effPct   = Math.round(effI * 100);
      const isShort  = len < shortChainBuckets;
      if (isShort) {
        console.log(`${startT}s – ${endT}s  ${len}b  ${rawPct}%  →${effPct}% MAX`);
      } else {
        const onMs   = Math.round(cycleMs * effI);
        const offMs  = cycleMs - onMs;
        const cycles = Math.round(((ce[i] - trends[i].startTime) * 1000) / cycleMs);
        console.log(`${startT}s – ${endT}s  ${len}b  ${rawPct}%  →${effPct}% [${onMs}, ~${offMs}] ×${cycles}`);
      }
      i += len;
    }
    console.groupEnd();
  }, [ready]);

  // pause and reset this video when another one starts
  useEffect(() => {
    if (playing !== null && playing !== src) {
      const video = videoRef.current;
      if (!video) return;
      video.pause();
      video.currentTime = 0;
    }
  }, [playing]);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.40)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.6)',
      borderRadius: '14px',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    }}>
      <video
        ref={videoRef}
        src={src}
        controls
        onPlay={() => currentVideo.set(src)}
        onPause={() => { if (currentVideo.get() === src) currentVideo.set(null); }}
        style={{ width: '100%', maxWidth: '100%', display: 'block', background: '#000' }}
      />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0', background: 'rgba(0,0,0,0.06)' }}>
        <HapticBlob intensity={playbackBucketIntensity} isShortBurst={playbackChainIsShortBurst} />
      </div>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.03em' }}>{title}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {loading && <span style={{ color: '#aaa', fontSize: '12px' }}>Analyzing…</span>}
          {error && <span style={{ color: '#c00', fontSize: '12px' }}>Load failed</span>}
          <small style={{ color: '#555', fontSize: '12px' }}>
            Credit: <a href={creditUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#555' }}>{credit}</a>
          </small>
        </span>
      </div>
    </div>
  );
}
