import { useEffect, useRef, useState } from 'react'

type NetworkStatusOptions = {
  checkUrl?: string
  interval?: number
  timeout?: number
  enabled?: boolean
}

type NetworkStatus = {
  isOnline: boolean
  isOffline: boolean
  isReachable: boolean
  isChecking: boolean
  lastChecked: number | null
}

export function useNetworkStatus({
  checkUrl = 'https://www.google.com/favicon.ico',
  interval = 30000,
  timeout = 3000,
  enabled = true,
}: NetworkStatusOptions = {}): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [isReachable, setIsReachable] = useState<boolean>(true)
  const [isChecking, setIsChecking] = useState<boolean>(false)
  const [lastChecked, setLastChecked] = useState<number | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const checkInternet = async () => {
    if (!enabled) return

    // Skip if page is hidden
    if (document.visibilityState === 'hidden') return

    // Cancel previous request
    abortRef.current?.abort()

    const controller = new AbortController()
    abortRef.current = controller

    setIsChecking(true)

    const timeoutId = setTimeout(() => {
      controller.abort()
    }, timeout)

    try {
      await fetch(checkUrl, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      })

      setIsReachable(true)
    } catch (err) {
      setIsReachable(false)
    } finally {
      clearTimeout(timeoutId)
      setIsChecking(false)
      setLastChecked(Date.now())
    }
  }

  useEffect(() => {
    if (!enabled) return

    const handleOnline = () => {
      setIsOnline(true)
      checkInternet()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsReachable(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    checkInternet()

    // Adaptive polling interval
    const getAdaptiveInterval = () => {
      if (!isOnline) return 30000 // less frequent when offline
      if (!isReachable) return 5000 // retry faster if unreachable
      return interval // default
    }

    const runCheck = () => {
      if (document.visibilityState === 'hidden') return
      checkInternet()
    }

    const start = () => {
      const adaptiveInterval = getAdaptiveInterval()
      intervalRef.current = setInterval(runCheck, adaptiveInterval)
    }

    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runCheck()
        start()
      } else {
        stop()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    start()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stop()
      abortRef.current?.abort()
    }
  }, [checkUrl, interval, timeout, enabled, isOnline, isReachable])

  return {
    isOnline,
    isOffline: !isOnline,
    isReachable,
    isChecking,
    lastChecked,
  }
}