import { useState, type CSSProperties } from 'react';
import './UsageTabs.css';

type Tab = 'react' | 'vanilla';
const ACCENT = '#7c3aed';

export default function CodeTabs({ react, vanilla }: { react: string; vanilla: string }) {
  const [tab, setTab] = useState<Tab>('react');
  const [copied, setCopied] = useState(false);

  const snippets: Record<Tab, string> = { react, vanilla };

  const copy = () => {
    void navigator.clipboard.writeText(snippets[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabBtn = (t: Tab): CSSProperties => ({
    padding: '6px 18px',
    borderRadius: '6px',
    border: '1.5px solid',
    borderColor: tab === t ? ACCENT : '#e0e0e0',
    background: tab === t ? ACCENT : 'transparent',
    color: tab === t ? '#fff' : '#888',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button className="usage-tab-btn" style={tabBtn('react')} onClick={() => setTab('react')}>React</button>
        <button className="usage-tab-btn" style={tabBtn('vanilla')} onClick={() => setTab('vanilla')}>Vanilla JS</button>
      </div>
      <div style={{ position: 'relative' }}>
        <pre style={{
          background: '#0f0f0f',
          color: '#e8e8e8',
          padding: '28px',
          borderRadius: '10px',
          fontSize: '0.875rem',
          lineHeight: 1.8,
          margin: 0,
          overflowX: 'auto',
        }}>
          <code>{snippets[tab]}</code>
        </pre>
        <button
          className="usage-copy-btn"
          onClick={copy}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: copied ? ACCENT : 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#ddd',
            padding: '4px 14px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 500,
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
