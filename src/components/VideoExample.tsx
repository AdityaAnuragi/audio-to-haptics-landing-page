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
    <div style={{ marginBottom: '48px' }}>
      <h3 style={{ marginBottom: '8px' }}>{title}</h3>
      {loading && <p style={{ color: '#888', fontSize: '14px', margin: '0 0 8px' }}>Analyzing audio...</p>}
      {error && <p style={{ color: '#c00', fontSize: '14px', margin: '0 0 8px' }}>Could not load audio.</p>}
      <video
        ref={videoRef}
        src={src}
        controls
        style={{ width: '100%', display: 'block', background: '#000' }}
      />
      <small style={{ color: '#888' }}>
        Credit: <a href={creditUrl} target="_blank" rel="noopener noreferrer">{credit}</a>
      </small>
    </div>
  );
}
