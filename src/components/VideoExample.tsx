import { useRef, useEffect } from 'react';
import { useHaptics } from 'audio-to-haptics/react';

interface Props {
  src: string;
  title: string;
  credit: string;
  creditUrl: string;
}

export default function VideoExample({ src, title, credit, creditUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { analyze, loading, error } = useHaptics(videoRef);

  useEffect(() => {
    void analyze(src);
  }, []);

  return (
    <div style={{
      marginBottom: '32px',
      background: '#fff',
      border: '1px solid #ebebeb',
      borderRadius: '14px',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    }}>
      <video
        ref={videoRef}
        src={src}
        controls
        style={{ width: '100%', maxWidth: '100%', display: 'block', background: '#000' }}
      />
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.03em' }}>{title}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {loading && <span style={{ color: '#aaa', fontSize: '12px' }}>Analyzing…</span>}
          {error && <span style={{ color: '#c00', fontSize: '12px' }}>Load failed</span>}
          <small style={{ color: '#bbb', fontSize: '12px' }}>
            Credit: <a href={creditUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#bbb' }}>{credit}</a>
          </small>
        </span>
      </div>
    </div>
  );
}
