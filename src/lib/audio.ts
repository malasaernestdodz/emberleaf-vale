import { mulberry32 } from './math'
import { settings } from './settings'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let musicBus: GainNode | null = null
let sfxBus: GainNode | null = null
let noiseBuf: AudioBuffer | null = null
const rng = mulberry32(20260830)
let windStarted = false
let musicStarted = false
let birdTimer = 0
let chordIdx = 0

const PENTA = [220, 246.9, 261.6, 329.6, 392, 440, 523.3, 587.3]
const CHORDS: number[][] = [
  [220, 277.2, 329.6],
  [174.6, 220, 261.6],
  [196, 246.9, 293.7],
  [164.8, 207.7, 246.9],
]

function ensure(): AudioContext | null {
  if (!ctx) return null
  if (ctx.state === 'suspended') void ctx.resume().catch(() => void 0)
  return ctx.state === 'closed' ? null : ctx
}

function applyVolumes() {
  if (!ctx || !master || !musicBus || !sfxBus) return
  const t = ctx.currentTime
  master.gain.setTargetAtTime(audio.master, t, 0.05)
  sfxBus.gain.setTargetAtTime(audio.sfx ? 1 : 0, t, 0.04)
  musicBus.gain.setTargetAtTime(audio.ambience ? 0.85 * settings.get().music : 0, t, 0.08)
}

export const audio = {
  master: 0.8,
  sfx: true,
  ambience: true,
  prev: 0.8,
}

export function setMaster(v: number) {
  audio.master = Math.min(1, Math.max(0, v))
  if (audio.master > 0) audio.prev = audio.master
  applyVolumes()
}

export function setSfx(on: boolean) {
  audio.sfx = on
  applyVolumes()
}

export function setAmbience(on: boolean) {
  audio.ambience = on
  applyVolumes()
  if (on) {
    startWind()
    startMusic()
    scheduleBird(2 + rng() * 4)
  }
}

export function audioSnapshot() {
  return {
    master: Math.round(audio.master * 100) / 100,
    sfx: audio.sfx,
    ambience: audio.ambience,
    muted: audio.master <= 0,
    unlocked: ctx !== null && ctx.state === 'running',
  }
}

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    try {
      ctx = new AC()
    } catch {
      ctx = null
      return
    }
    master = ctx.createGain()
    master.connect(ctx.destination)
    musicBus = ctx.createGain()
    sfxBus = ctx.createGain()
    musicBus.connect(master)
    sfxBus.connect(master)
    const len = ctx.sampleRate
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < len; i++) {
      const s = Math.sin(i * 12.9898) * 43758.5453
      d[i] = (s - Math.floor(s)) * 2 - 1
    }
    applyVolumes()
    settings.subscribe(applyVolumes)
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => void 0)
  startWind()
  startMusic()
  scheduleBird(3 + rng() * 5)
}

function noiseSrc(c: AudioContext) {
  const src = c.createBufferSource()
  if (noiseBuf) src.buffer = noiseBuf
  src.loop = true
  return src
}

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
}

function tone(
  freq0: number,
  freq1: number,
  dur: number,
  type: OscillatorType,
  peak: number,
  when = 0,
  dest: GainNode | null = sfxBus
) {
  const c = ensure()
  if (!c || !dest) return
  const t = c.currentTime + when
  const o = c.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(Math.max(freq0, 1), t)
  if (freq1 !== freq0) o.frequency.exponentialRampToValueAtTime(Math.max(freq1, 1), t + dur)
  const g = c.createGain()
  env(g, t, peak, Math.min(0.02, dur * 0.2), dur)
  o.connect(g)
  g.connect(dest)
  o.start(t)
  o.stop(t + dur + 0.1)
}

function noise(
  filterType: BiquadFilterType,
  f0: number,
  f1: number,
  q: number,
  dur: number,
  peak: number,
  when = 0
) {
  const c = ensure()
  if (!c || !sfxBus) return
  const t = c.currentTime + when
  const src = noiseSrc(c)
  const flt = c.createBiquadFilter()
  flt.type = filterType
  flt.Q.value = q
  flt.frequency.setValueAtTime(Math.max(f0, 20), t)
  if (f1 !== f0) flt.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur)
  const g = c.createGain()
  env(g, t, peak, Math.min(0.015, dur * 0.15), dur)
  src.connect(flt)
  flt.connect(g)
  g.connect(sfxBus)
  src.start(t)
  src.stop(t + dur + 0.1)
}

export type SfxName =
  | 'step'
  | 'swing'
  | 'chop'
  | 'creak'
  | 'crash'
  | 'thud'
  | 'pickup'
  | 'throw'
  | 'eat'
  | 'cast'
  | 'bite'
  | 'reel'
  | 'splash'
  | 'sleep'
  | 'wake'
  | 'page'
  | 'sit'
  | 'hover'
  | 'click'
  | 'back'
  | 'toast'
  | 'menu'
  | 'test'
  | 'quest'
  | 'hit'
  | 'pop'
  | 'hop'

const vary = (amount: number) => 1 + (rng() - 0.5) * 2 * amount

export function playSfx(name: SfxName) {
  switch (name) {
    case 'step':
      noise('lowpass', 900 * vary(0.3), 300, 0.8, 0.09, 0.1)
      break
    case 'swing':
      noise('bandpass', 500, 2200, 1.4, 0.16, 0.22)
      break
    case 'chop':
      tone(170 * vary(0.15), 55, 0.1, 'sine', 0.5)
      noise('lowpass', 1400, 500, 0.7, 0.08, 0.3)
      break
    case 'creak':
      tone(95, 62, 0.7, 'sawtooth', 0.1)
      tone(190, 130, 0.7, 'sawtooth', 0.04, 0.08)
      break
    case 'crash':
      noise('lowpass', 1100, 160, 0.6, 0.5, 0.5)
      tone(95, 34, 0.45, 'sine', 0.55, 0.03)
      noise('highpass', 2500, 4000, 0.5, 0.25, 0.12, 0.05)
      break
    case 'thud':
      tone(85, 36, 0.22, 'sine', 0.4)
      break
    case 'pickup':
      tone(430 * vary(0.12), 760 * vary(0.1), 0.09, 'triangle', 0.28)
      tone(760, 1000, 0.07, 'triangle', 0.16, 0.07)
      break
    case 'throw':
      noise('bandpass', 1800, 500, 1.2, 0.22, 0.2)
      break
    case 'eat':
      noise('lowpass', 800, 350, 0.8, 0.07, 0.3)
      noise('lowpass', 700, 300, 0.8, 0.07, 0.26, 0.12)
      tone(300, 180, 0.1, 'triangle', 0.12, 0.22)
      break
    case 'cast':
      noise('bandpass', 900, 350, 1.1, 0.24, 0.16)
      break
    case 'bite':
      tone(650, 650, 0.05, 'square', 0.16)
      tone(880, 880, 0.06, 'square', 0.16, 0.09)
      break
    case 'reel':
      for (let i = 0; i < 4; i++) tone(1300 * vary(0.2), 900, 0.03, 'square', 0.08, i * 0.055)
      break
    case 'splash':
      noise('lowpass', 1600, 250, 0.6, 0.4, 0.4)
      tone(320, 90, 0.2, 'sine', 0.14)
      break
    case 'sleep':
      tone(660, 660, 0.7, 'sine', 0.2)
      tone(990, 990, 0.9, 'sine', 0.12, 0.18)
      break
    case 'wake':
      tone(523, 523, 0.35, 'sine', 0.16)
      tone(659, 659, 0.35, 'sine', 0.16, 0.14)
      tone(784, 784, 0.55, 'sine', 0.18, 0.28)
      break
    case 'page':
      noise('highpass', 2600, 5200, 0.4, 0.16, 0.14)
      break
    case 'sit':
      tone(140, 70, 0.14, 'sine', 0.22)
      break
    case 'hover':
      tone(1900, 2100, 0.03, 'sine', 0.05)
      break
    case 'click':
      tone(340, 520, 0.05, 'triangle', 0.18)
      tone(520, 700, 0.05, 'triangle', 0.1, 0.045)
      break
    case 'back':
      tone(520, 300, 0.07, 'triangle', 0.16)
      break
    case 'toast':
      tone(880, 880, 0.09, 'sine', 0.1)
      tone(1174, 1174, 0.12, 'sine', 0.07, 0.07)
      break
    case 'menu':
      noise('bandpass', 700, 180, 0.9, 0.18, 0.12)
      tone(420, 300, 0.12, 'triangle', 0.1)
      break
    case 'test':
      tone(523, 523, 0.16, 'sine', 0.2)
      tone(659, 659, 0.16, 'sine', 0.2, 0.12)
      tone(784, 784, 0.3, 'sine', 0.22, 0.24)
      break
    case 'quest':
      tone(523, 523, 0.14, 'triangle', 0.2)
      tone(659, 659, 0.14, 'triangle', 0.2, 0.11)
      tone(784, 784, 0.14, 'triangle', 0.22, 0.22)
      tone(1046, 1046, 0.4, 'triangle', 0.2, 0.33)
      break
    case 'hit':
      tone(260, 90, 0.09, 'square', 0.3)
      noise('lowpass', 2000, 600, 0.8, 0.07, 0.32)
      break
    case 'pop':
      tone(300, 900, 0.12, 'sine', 0.3)
      noise('highpass', 1800, 3600, 0.6, 0.1, 0.14, 0.02)
      tone(900, 1400, 0.1, 'sine', 0.12, 0.08)
      break
    case 'hop':
      tone(280, 520, 0.1, 'sine', 0.12)
      break
  }
}

function startWind() {
  const c = ensure()
  if (!c || !musicBus || windStarted || !audio.ambience) return
  windStarted = true
  const src = noiseSrc(c)
  const flt = c.createBiquadFilter()
  flt.type = 'lowpass'
  flt.frequency.value = 420
  flt.Q.value = 0.4
  const g = c.createGain()
  g.gain.value = 0
  g.gain.setTargetAtTime(0.05, c.currentTime, 3)
  const lfo = c.createOscillator()
  lfo.frequency.value = 0.07
  const lfoGain = c.createGain()
  lfoGain.gain.value = 0.022
  lfo.connect(lfoGain)
  lfoGain.connect(g.gain)
  src.connect(flt)
  flt.connect(g)
  g.connect(musicBus)
  src.start()
  lfo.start()
}

function chirp(when: number) {
  const c = ensure()
  if (!c || !musicBus) return
  const t = c.currentTime + when
  const base = 2400 + rng() * 1400
  const pan = c.createStereoPanner()
  pan.pan.value = rng() * 1.6 - 0.8
  pan.connect(musicBus)
  const pulses = 2 + Math.floor(rng() * 3)
  for (let i = 0; i < pulses; i++) {
    const o = c.createOscillator()
    o.type = 'sine'
    const f = base * vary(0.1)
    o.frequency.setValueAtTime(f, t + i * 0.09)
    o.frequency.exponentialRampToValueAtTime(f * 1.25, t + i * 0.09 + 0.04)
    const g = c.createGain()
    env(g, t + i * 0.09, 0.028, 0.01, 0.06)
    o.connect(g)
    g.connect(pan)
    o.start(t + i * 0.09)
    o.stop(t + i * 0.09 + 0.12)
  }
}

function scheduleBird(delay: number) {
  window.clearTimeout(birdTimer)
  birdTimer = window.setTimeout(() => {
    if (!ctx || !audio.ambience) return
    chirp(0)
    if (rng() > 0.6) chirp(0.5 + rng() * 0.8)
    scheduleBird(4 + rng() * 8)
  }, delay * 1000)
}

function pad(freqs: number[], dur: number) {
  const c = ensure()
  if (!c || !musicBus) return
  const t = c.currentTime
  const flt = c.createBiquadFilter()
  flt.type = 'lowpass'
  flt.frequency.setValueAtTime(500, t)
  flt.frequency.linearRampToValueAtTime(760, t + dur * 0.5)
  flt.frequency.linearRampToValueAtTime(480, t + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.05, t + 2.4)
  g.gain.setValueAtTime(0.05, t + dur - 2.2)
  g.gain.linearRampToValueAtTime(0.0001, t + dur)
  flt.connect(g)
  g.connect(musicBus)
  for (const f of freqs) {
    for (const det of [-1.6, 1.6]) {
      const o = c.createOscillator()
      o.type = 'triangle'
      o.frequency.value = f
      o.detune.value = det
      const og = c.createGain()
      og.gain.value = 0.34 / freqs.length
      o.connect(og)
      og.connect(flt)
      o.start(t)
      o.stop(t + dur + 0.1)
    }
  }
}

function startMusic() {
  if (musicStarted || !audio.ambience) return
  musicStarted = true
  pad(CHORDS[0], 11)
  window.setInterval(() => {
    if (!ctx) return
    chordIdx = (chordIdx + 1) % CHORDS.length
    pad(CHORDS[chordIdx], 11)
  }, 10500)
  const pluck = () => {
    const c = ensure()
    if (c && musicBus && rng() > 0.25) {
      const f = PENTA[Math.floor(rng() * PENTA.length)] * (rng() > 0.7 ? 2 : 1)
      tone(f, f, 1.4, 'sine', 0.05, 0, musicBus)
      if (rng() > 0.6) tone(f * 1.5, f * 1.5, 1.2, 'sine', 0.03, 0.3, musicBus)
    }
    window.setTimeout(pluck, 2800 + rng() * 4200)
  }
  window.setTimeout(pluck, 4000)
}
