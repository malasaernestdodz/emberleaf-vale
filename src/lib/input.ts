const keys = new Set<string>()
const edges = new Set<string>()
const clickEdges = new Set<number>()
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
  const has = edges.has(code)
  edges.delete(code)
  return has
}

export function consumeClickEdge(button: number) {
  const has = clickEdges.has(button)
  clickEdges.delete(button)
  return has
}

let installed = false

export function initInput() {
  if (installed) return
  installed = true
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
    if (!e.repeat) edges.add(e.code)
    keys.add(e.code)
    notifyInput()
  })
  window.addEventListener('keyup', (e) => keys.delete(e.code))
  window.addEventListener('blur', () => {
    keys.clear()
    edges.clear()
    clickEdges.clear()
    mouseDown = false
  })
  window.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return
    mouseDown = true
    downX = e.clientX
    downY = e.clientY
    notifyInput()
  })
  window.addEventListener('mouseup', (e) => {
    if (e.button !== 0 || !mouseDown) return
    mouseDown = false
    if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) clickEdges.add(0)
  })
}
