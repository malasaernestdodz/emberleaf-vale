const keys = new Set<string>()
const edges = new Set<string>()
const recent = new Map<string, number>()
type ClickEdge = { button: number; t: number; expires: boolean }
const clickQueue: ClickEdge[] = []
const EDGE_BUFFER_MS = 5000
const CLICK_EDGE_BUFFER_MS = 150
let mouseDown = false
let downX = 0
let downY = 0
let started = false
const listeners: (() => void)[] = []

export function notifyInput() {
  if (!started) {
    started = true
    for (const f of listeners) f()
    listeners.length = 0
  }
}

export function onFirstInput(cb: () => void) {
  if (started) cb()
  else listeners.push(cb)
}

export function isDown(...codes: string[]) {
  return codes.some((c) => keys.has(c))
}

export function consumeEdge(code: string) {
  if (edges.has(code)) {
    edges.delete(code)
    recent.delete(code)
    return true
  }
  const t = recent.get(code)
  if (t !== undefined && performance.now() - t < EDGE_BUFFER_MS) {
    recent.delete(code)
    return true
  }
  return false
}

function queueClickEdge(button: number, expires: boolean) {
  clickQueue.push({ button, t: performance.now(), expires })
}

export function probeClickEdge(button: number) {
  queueClickEdge(button, false)
}

export function consumeClickEdge(button: number) {
  const now = performance.now()
  const idx = clickQueue.findIndex((e) => e.button === button)
  if (idx === -1) return false
  const [e] = clickQueue.splice(idx, 1)
  return !e.expires || now - e.t <= CLICK_EDGE_BUFFER_MS
}

export function discardClickEdges() {
  clickQueue.length = 0
}

let installed = false

export function initInput() {
  if (installed) return
  installed = true
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
    if (!e.repeat) {
      edges.add(e.code)
      recent.set(e.code, performance.now())
    }
    keys.add(e.code)
    notifyInput()
  })
  window.addEventListener('keyup', (e) => keys.delete(e.code))
  window.addEventListener('blur', () => {
    keys.clear()
    edges.clear()
    recent.clear()
    clickQueue.length = 0
    mouseDown = false
  })
  window.addEventListener('mousedown', (e) => {
    const target = e.target as Element | null
    if (target && target.closest && target.closest('.clickable-ui')) return
    if (e.button === 2) {
      queueClickEdge(2, true)
      notifyInput()
      return
    }
    if (e.button !== 0) return
    mouseDown = true
    downX = e.clientX
    downY = e.clientY
    notifyInput()
  })
  window.addEventListener('contextmenu', (e) => e.preventDefault())
  window.addEventListener('mouseup', (e) => {
    if (e.button !== 0 || !mouseDown) return
    mouseDown = false
    if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) {
      queueClickEdge(0, true)
    }
  })
}
