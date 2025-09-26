'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js')
      } catch (e) {
        // noop: SW 등록 실패는 앱 동작에 치명적이지 않음
      }
    }

    register()
  }, [])

  return null
}


