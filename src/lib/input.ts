const keys = new Set<string>()
const edges = new Set<string>()
const recent = new Map<string, number>()
const clickEdges = new Set<number>()
const clickRecent = new Map<number, number>()
const EDGE_BUFFER_MS = 500
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
  if (clickEdges.has(button)) {
    clickEdges.delete(button)
    clickRecent.delete(button)
    return true
  }
  const t = clickRecent.get(button)
  if (t !== undefined && performance.now() - t < EDGE_BUFFER_MS) {
    clickRecent.delete(button)
    return true
  }
  return false
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
    if (e.button !== 0) return
    const target = e.target as Element | null
    if (target && target.closest && target.closest('.clickable-ui')) return
    mouseDown = true
    downX = e.clientX
    downY = e.clientY
    notifyInput()
  })
  window.addEventListener('mouseup', (e) => {
    if (e.button !== 0 || !mouseDown) return
    mouseDown = false
    if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) {
      clickEdges.add(0)
      clickRecent.set(0, performance.now())
    }
  })
}
