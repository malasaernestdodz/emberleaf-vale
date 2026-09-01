export const SLASH_TIME = 0.25
export const FADE_TIME = 0.12
export const COMBO_WINDOW = 1.1

export type SlashState = {
  stage: 0 | 1
  dir: 1 | -1
  active: boolean
  t: number
  since: number
}

export const slash: SlashState = { stage: 0, dir: 1, active: false, t: 0, since: Infinity }

export function startSlash() {
  slash.stage = slash.active || slash.since <= COMBO_WINDOW ? ((slash.stage ^ 1) as 0 | 1) : 0
  slash.dir = slash.stage === 0 ? 1 : -1
  slash.active = true
  slash.t = 0
  slash.since = 0
}

export function tickSlash(dt: number) {
  slash.since += dt
  if (slash.active) {
    slash.t += dt
    if (slash.t >= SLASH_TIME + FADE_TIME) {
      slash.active = false
      slash.t = 0
    }
  }
}

export function resetSlash() {
  slash.active = false
  slash.stage = 0
  slash.dir = 1
  slash.t = 0
  slash.since = Infinity
}
