import type { EffectScope } from "vue"
import type { Pinia } from "./store"
export function createDispose(scope: EffectScope, pinia: Pinia, id: string ) {
  return function $dispose() {
    scope.stop()
    pinia._s.delete(id)
  }
}
