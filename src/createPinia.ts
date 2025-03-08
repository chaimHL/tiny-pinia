import { effectScope, ref } from 'vue'
import { piniaSymbol } from './rootStore'
import type { App } from 'vue'
export function createPinia() {
  const scope = effectScope()
  const state = scope.run(() => ref<Record<string, any>>({}))!

  const pinia = {
    install(app: App) {
      app.provide(piniaSymbol, pinia)
    },
    _e: scope,
    _s: new Map(),
    state
   }
  return pinia
}
