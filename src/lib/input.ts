const keys = new Set<string>()
const edges = new Set<string>()
const recent = new Map<string, number>()
const clickEdges = new Set<number>()
const clickRecent = new Map<number, number>()
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

export function consumeClickEdge(button: number) {
  const now = performance.now()
  if (clickEdges.has(button)) {
    const t = clickRecent.get(button)
    clickEdges.delete(button)
    clickRecent.delete(button)
    return t !== undefined && now - t <= CLICK_EDGE_BUFFER_MS
  }
  const t = clickRecent.get(button)
  if (t !== undefined && now - t < CLICK_EDGE_BUFFER_MS) {
    clickRecent.delete(button)
    return true
  }
  return false
}

export function discardClickEdges() {
  clickEdges.delete(0)
  clickEdges.delete(2)
  clickRecent.delete(0)
  clickRecent.delete(2)
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
    clickEdges.clear()
    clickRecent.clear()
    mouseDown = false
  })
  window.addEventListener('mousedown', (e) => {
    const target = e.target as Element | null
    if (target && target.closest && target.closest('.clickable-ui')) return
    if (e.button === 2) {
      clickEdges.add(2)
      clickRecent.set(2, performance.now())
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
      clickEdges.add(0)
      clickRecent.set(0, performance.now())
    }
  })
}
