import { useState } from 'react';

type Tab = 'react' | 'vanilla';

const SNIPPETS: Record<Tab, string> = {
  react: `import { useHaptics } from 'audio-to-haptics/react';

const audioRef = useRef<HTMLAudioElement>(null);
const { analyze, ready, loading, error } = useHaptics(audioRef);

// <audio ref={audioRef} controls />
// analyze('your-audio-url.mp3')`,

  vanilla: `import { HapticEngine } from 'audio-to-haptics';

const engine = new HapticEngine();
await engine.analyze(url);
engine.attach(audioElement);

// engine.detach()      — stop haptics, remove listeners
// engine.muted = true  — suppress vibration without stopping`,
};

export default function UsageTabs() {
  const [tab, setTab] = useState<Tab>('react');
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(SNIPPETS[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabBtn = (t: Tab): React.CSSProperties => ({
    padding: '6px 16px',
    borderRadius: '6px',
    border: '1px solid',
    borderColor: tab === t ? '#111' : '#ddd',
    background: tab === t ? '#111' : 'transparent',
    color: tab === t ? '#fff' : '#888',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button style={tabBtn('react')} onClick={() => setTab('react')}>React</button>
        <button style={tabBtn('vanilla')} onClick={() => setTab('vanilla')}>Vanilla JS</button>
      </div>
      <div style={{ position: 'relative' }}>
        <pre style={{
          background: '#111',
          color: '#f8f8f8',
          padding: '24px',
          borderRadius: '8px',
          fontSize: '0.875rem',
          lineHeight: 1.7,
          margin: 0,
          overflowX: 'auto',
        }}>
          <code>{SNIPPETS[tab]}</code>
        </pre>
        <button
          onClick={copy}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ccc',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
