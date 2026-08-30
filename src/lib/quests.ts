import { playSfx } from './audio'
import { game } from './world'

export type Quest = {
  id: string
  title: string
  desc: string
  target: number
  progress: number
  done: boolean
}

export const quests: Quest[] = [
  { id: 'plaza', title: 'Heart of the Vale', desc: 'Visit the fountain plaza', target: 1, progress: 0, done: false },
  { id: 'flowers', title: 'Petal Gathering', desc: 'Pick up 3 flowers', target: 3, progress: 0, done: false },
  { id: 'chop', title: 'Firewood Run', desc: 'Chop a tree for wood', target: 1, progress: 0, done: false },
  { id: 'fish', title: 'Gone Fishing', desc: 'Catch a fish from the pond', target: 1, progress: 0, done: false },
  { id: 'slime', title: 'Slime Bopper', desc: 'Pop the garden slime', target: 1, progress: 0, done: false },
  { id: 'sleep', title: 'Sweet Dreams', desc: 'Sleep in a bed', target: 1, progress: 0, done: false },
  { id: 'lookout', title: 'The Keeper’s Watch', desc: 'Climb the windmill and take in the view', target: 1, progress: 0, done: false },
]

export function questsDone() {
  let n = 0
  for (const q of quests) if (q.done) n++
  return n
}

export function questEvent(id: string, n = 1) {
  let touched = false
  for (const q of quests) {
    if (q.id !== id || q.done) continue
    q.progress = Math.min(q.target, q.progress + n)
    if (q.progress >= q.target) {
      q.done = true
      game.toast =
        id === 'lookout' ? 'The whole vale rolls out below you…' : `Quest complete: ${q.title}`
      game.toastT = 3
      playSfx(id === 'lookout' ? 'page' : 'quest')
    }
    touched = true
  }
  if (touched) game.questVer++
}
