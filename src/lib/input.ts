const keys = new Set<string>()
const edges = new Set<string>()
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
  })
}
