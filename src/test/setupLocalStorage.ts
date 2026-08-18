// Vitest tourne en environnement Node : ni `window` ni `localStorage` n'existent nativement.
// Polyfill minimal en mémoire pour permettre aux tests du store d'écrire/lire sans jsdom.
if (typeof window === 'undefined') {
  const store = new Map<string, string>()
  const localStorageStub = {
    getItem: (cle: string) => store.get(cle) ?? null,
    setItem: (cle: string, valeur: string) => {
      store.set(cle, valeur)
    },
    removeItem: (cle: string) => {
      store.delete(cle)
    },
    clear: () => {
      store.clear()
    },
  }
  ;(globalThis as unknown as { window: { localStorage: typeof localStorageStub } }).window = {
    localStorage: localStorageStub,
  }
}
