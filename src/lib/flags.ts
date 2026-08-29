export const LITE =
  typeof location !== 'undefined' && new URLSearchParams(window.location.search).has('lite')
