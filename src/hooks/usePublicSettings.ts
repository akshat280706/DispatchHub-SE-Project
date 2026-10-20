import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export type SettingsMap = Record<string, unknown>

// Reads only settings marked is_public in the database (contact details, GST, limits...).
export function usePublicSettings() {
  const [settings, setSettings] = useState<SettingsMap>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    supabase
      .from('system_settings')
      .select('key,value')
      .then(({ data }) => {
        if (!active) return
        if (data) setSettings(Object.fromEntries(data.map((r) => [r.key as string, r.value])))
        setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])

  return { settings, loaded }
}

export function settingText(settings: SettingsMap, key: string, fallback: string): string {
  const v = settings[key]
  return typeof v === 'string' && v.trim() !== '' ? v : fallback
}

export function settingNumber(settings: SettingsMap, key: string, fallback: number): number {
  const v = settings[key]
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}
