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
    <div style={{ marginBottom: '56px' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      {loading && <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 8px' }}>Analyzing audio...</p>}
      {error && <p style={{ color: '#c00', fontSize: '13px', margin: '0 0 8px' }}>Could not load audio.</p>}
      <video
        ref={videoRef}
        src={src}
        controls
        style={{
          width: '100%',
          maxWidth: '640px',
          display: 'block',
          background: '#000',
          borderRadius: '8px',
        }}
      />
      <small style={{ display: 'block', marginTop: '8px', color: '#aaa', fontSize: '12px' }}>
        Credit: <a href={creditUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#aaa' }}>{credit}</a>
      </small>
    </div>
  );
}
