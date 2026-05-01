// ── Quick start ───────────────────────────────────────────────────────────────

export const BASIC_REACT = `\
import { useRef } from 'react'
import { useHaptics } from 'audio-to-haptics/react'

const ref = useRef<HTMLAudioElement>(null)
const { analyze, ready } = useHaptics(ref)

// Call analyze() once, then play — haptics fire automatically
analyze('YOUR_URL_OR_FILE')

// <audio ref={ref} controls />`;

export const BASIC_VANILLA = `\
import { HapticEngine } from 'audio-to-haptics'

const engine = new HapticEngine()
const audio = document.querySelector('audio')

await engine.analyze('YOUR_URL_OR_FILE')
engine.attach(audio)

// Play the audio — haptics fire automatically
// engine.detach()  — stop haptics and remove listeners`;

// ── Examples ──────────────────────────────────────────────────────────────────

export const FILE_REACT = `\
const { analyze, analyzeBuffer, ready } = useHaptics(ref)

// From URL
analyze('YOUR_URL_OR_FILE')

// From file input — same pipeline, local files
const onFile = async (e) =>
  analyzeBuffer(await e.target.files[0].arrayBuffer())

// <input type="file" accept="audio/*,video/*" onChange={onFile} />`;

export const FILE_VANILLA = `\
// From URL
await engine.analyze('YOUR_URL_OR_FILE')
engine.attach(audioEl)

// From file input
const onFile = async (e) => {
  await engine.analyzeBuffer(await e.target.files[0].arrayBuffer())
  engine.attach(audioEl)
}`;

export const VIDEO_REACT = `\
// Swap the ref type — everything else is identical
const ref = useRef<HTMLVideoElement>(null)
const { analyze, ready } = useHaptics(ref)

analyze('YOUR_VIDEO_URL')

// <video ref={ref} controls />`;

export const VIDEO_VANILLA = `\
const engine = new HapticEngine()
await engine.analyze('YOUR_VIDEO_URL')
engine.attach(document.querySelector('video'))`;

export const MUTE_REACT = `\
const { muted, toggleMuted } = useHaptics(ref)

// <button onClick={toggleMuted}>
//   {muted ? 'Unmute haptics' : 'Mute haptics'}
// </button>`;

export const MUTE_VANILLA = `\
engine.muted = true    // suppress vibration without stopping
engine.muted = false   // restore
engine.toggleMuted()   // flip state`;

export const VISUAL_REACT = `\
const {
  analyze,
  playbackBucketIntensity,    // 0–1, varies frame-by-frame as audio decays
  playbackChainIsShortBurst,  // true = transient (kick, gunshot, heartbeat)
                              // false = sustained (bass, long note) or silence
} = useHaptics(ref)

// Both update every animation frame automatically — no extra loop needed
// Plug into SVG, canvas, CSS — whatever you're building
<circle r={20 + playbackBucketIntensity * 40} />`;

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
await engine.analyze('YOUR_URL_OR_FILE')
engine.attach(audioEl)`;
