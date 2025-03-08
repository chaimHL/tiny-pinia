import { toRaw, isRef, isReactive, toRef } from "vue"

export function storeToRefs(store: any) {
  const rawStore = toRaw(store)
  const refs: Record<string, any>  = {}
  for (const key in rawStore) {
    const value = rawStore[key]
    if (isRef(value) || isReactive(value)) {
      refs[key] = toRef(store, key)
    }
  }
  return refs
}
