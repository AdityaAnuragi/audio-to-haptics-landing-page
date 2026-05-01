// ── Quick start ───────────────────────────────────────────────────────────────

export const BASIC_REACT = `\
import { useRef } from 'react'
import { useHaptics } from 'audio-to-haptics/react'

export default function App() {
  const ref = useRef<HTMLAudioElement>(null)
  const { analyze, ready } = useHaptics(ref)

  return (
    <div>
      <audio ref={ref} controls />
      <button onClick={() => analyze('YOUR_AUDIO_URL')}>
        {ready ? 'Re-analyze' : 'Load audio'}
      </button>
    </div>
  )
}`;

export const BASIC_VANILLA = `\
import { HapticEngine } from 'audio-to-haptics'

const engine = new HapticEngine()
const audio = document.querySelector('audio')

await engine.analyze('YOUR_AUDIO_URL')
engine.attach(audio)

// Play the audio — haptics fire automatically

const stopBtn = document.querySelector('button')
stopBtn.addEventListener('click', () => engine.detach())`;

// ── Examples ──────────────────────────────────────────────────────────────────

export const FILE_REACT = `\
const { analyze, analyzeBuffer, ready } = useHaptics(ref)

// From URL
analyze('YOUR_AUDIO_URL')

// From file input — same pipeline, local files
const onFile = async (e) =>
  analyzeBuffer(await e.target.files[0].arrayBuffer())

// In your JSX:
// <input type="file" accept="audio/*,video/*" onChange={onFile} />`;

export const FILE_VANILLA = `\
// From URL
await engine.analyze('YOUR_AUDIO_URL')
engine.attach(audioEl)

// From file input
const onFile = async (e) => {
  await engine.analyzeBuffer(await e.target.files[0].arrayBuffer())
  engine.attach(audioEl)
}

// In your HTML:
// <input type="file" accept="audio/*,video/*" onchange="onFile(event)" />`;

export const VIDEO_REACT = `\
// Swap the ref type — everything else is identical
const ref = useRef<HTMLVideoElement>(null)
const { analyze, ready } = useHaptics(ref)

analyze('YOUR_VIDEO_URL')

// In your JSX:
// <video ref={ref} controls />`;

export const VIDEO_VANILLA = `\
const engine = new HapticEngine()
await engine.analyze('YOUR_VIDEO_URL')
engine.attach(document.querySelector('video'))

// In your HTML:
// <video controls></video>`;

export const MUTE_REACT = `\
const { muted, toggleMuted } = useHaptics(ref)

// In your JSX:
// <button onClick={toggleMuted}>
//   {muted ? 'Unmute haptics' : 'Mute haptics'}
// </button>`;

export const MUTE_VANILLA = `\
engine.muted = true    // suppress vibration without stopping
engine.muted = false   // restore
engine.toggleMuted()   // flip state

// In your HTML:
// <button onclick="engine.toggleMuted()">Toggle haptics</button>`;

export const VISUAL_REACT = `\
const {
  analyze,
  playbackBucketIntensity,    // 0–1, varies frame-by-frame as audio decays
  playbackChainIsShortBurst,  // true = transient (kick, gunshot, heartbeat)
                              // false = sustained (bass, long note) or silence
} = useHaptics(ref)

// Both update every animation frame — no extra loop needed
// Plug into SVG, canvas, CSS — whatever you're building

// In your JSX:
// <circle r={20 + playbackBucketIntensity * 40} />`;

export const VISUAL_VANILLA = `\
engine.attach(audioEl, (time, chainIntensity, bucketIntensity, isShortBurst) => {
  // Called every animation frame while playing
  // bucketIntensity:  0–1, varies frame-by-frame as audio decays
  // isShortBurst:     true = transient, false = sustained or silence
  updateBlob(bucketIntensity, isShortBurst)
})`;

export const OPTS_REACT = `\
// Pass options as a second argument — applied at construction
const { analyze, ready } = useHaptics(ref, {
  spikeRatio: 2.0,        // higher = fewer, more dramatic haptics
  intensityFloor: 0.65,   // minimum vibration strength (0–1)
  shortChainBuckets: 8,   // chains shorter than this fire as a solid pulse
})`;

export const OPTS_VANILLA = `\
const engine = new HapticEngine({
  spikeRatio: 2.0,
  intensityFloor: 0.65,
  shortChainBuckets: 8,
})
await engine.analyze('YOUR_AUDIO_URL')
engine.attach(audioEl)`;
