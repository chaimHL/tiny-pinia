import { computed, type ComputedRef, effectScope, type EffectScope, inject, isReactive, isRef, type Reactive, reactive, ref, toRefs } from "vue"
import { piniaSymbol } from "./rootStore"
import type { createPinia } from "./createPinia"

type Pinia = ReturnType<typeof createPinia>


export function defineStore(id: string, options: Record<string, any>): () => any
// setup 风格的写法其实还能接收第 3个参数作为插件选项，此处忽略
export function defineStore<SS>(id: string, storeSetup: () => SS): () => any
export function defineStore(id: string, setup: any) {
  const isSetupStore = typeof setup === 'function'
  const options = isSetupStore ? {} : setup
  function useStore() {
    const pinia = inject(piniaSymbol) as Pinia
    if (!pinia._s.has(id)) {
      if (isSetupStore) {
        createSetupStore(id, setup, pinia)
      } else {
        createOptionsStore(id, options, pinia)
      }
    }
    return pinia._s.get(id)
  }
  return useStore
}

function createSetupStore<SS>(id: string, setup: () => SS, pinia: Pinia) {
  const store: Record<string, any> = reactive({})
  const setupStore = setup()
  let storeScope: EffectScope
  const result = pinia._e.run(() => {
    storeScope = effectScope()
    return storeScope.run(() => processSetup<SS>(id, setupStore, pinia))
  })
  const $dispose = createDispose(storeScope, pinia, id)
  createStore(pinia, store, result, id, $dispose)
}

function createOptionsStore(id: string, options: any, pinia: Pinia) {
  const store: Record<string, any> = reactive({})
  let storeScope: EffectScope
  const result = pinia._e.run(() => {
    storeScope = effectScope()
    return storeScope.run(() => processOptions(id, options, pinia, store))
  })
  const $dispose = createDispose(storeScope, pinia, id)
  createStore(pinia, store, result, id, $dispose)
}

function createStore(pinia: Pinia, store: Record<string, any>, result: any, id: string, $dispose: () => void) {
  Object.assign(store, result, $dispose)
  pinia._s.set(id, store)
  store.$id = id
}

function processOptions(id: string, options: any, pinia: Pinia, store: Reactive<any>) {
  const { state, getters, actions } = options

  // 处理 state
  const storeState = toRefs(ref(state ? state() : {}).value)
  pinia.state.value[id] = storeState

  // 处理 getters
  const storeGetters = Object.keys(getters || {}).reduce((computedGetters, name) => {
    computedGetters[name] = computed(() => getters[name].call(store, store))
    return computedGetters
  }, {} as Record<string, ComputedRef>)

  // 处理 actions
  const storeActions: Record<string, () => any> = {}
  for (const name in actions) {
    const action = actions[name]
    storeActions[name] = function (...rest) {
      return action.apply(store, rest)
    }
  }

  return {
    ...storeState,
    ...storeGetters,
    ...storeActions
  }
}

function processSetup<SS>(id: string, setupStore: SS, pinia: Pinia) {
  if (!pinia.state?.value[id]) pinia.state.value[id] = {}
  for (const key in setupStore) {
    const prop = setupStore[key]
    if ((isRef(prop) && !isComputed(prop)) || isReactive(prop)) {
      pinia.state.value[id][key] = prop
    }
  }
  return setupStore
}

function isComputed(value: any) {
  return !!(isRef(value) && (value as any).effect)
}

function createDispose(scope: EffectScope, pinia: Pinia, id: string ) {
  return function $dispose() {
    scope.stop()
    pinia._s.delete(id)
  }
}
