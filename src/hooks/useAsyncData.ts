import { useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '../lib/errors'

interface Settled<T> {
  key: string
  data: T | null
  error: string | null
}

// Loads data when `key` changes. `loading` is true until the result for the current key arrives.
export function useAsyncData<T>(key: string, loader: () => Promise<T>) {
  const [reloadCount, setReloadCount] = useState(0)
  const fullKey = `${key}#${reloadCount}`
  const [result, setResult] = useState<Settled<T> | null>(null)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    let active = true
    loaderRef
      .current()
      .then((data) => {
        if (active) setResult({ key: fullKey, data, error: null })
      })
      .catch((e: unknown) => {
        if (active) setResult({ key: fullKey, data: null, error: getErrorMessage(e) })
      })
    return () => {
      active = false
    }
  }, [fullKey])

  const settled = result !== null && result.key === fullKey ? result : null
  return {
    data: settled?.data ?? null,
    error: settled?.error ?? null,
    loading: settled === null,
    reload: () => setReloadCount((c) => c + 1),
  }
}