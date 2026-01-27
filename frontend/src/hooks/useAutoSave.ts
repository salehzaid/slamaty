import { useState, useEffect, useCallback, useRef } from 'react'

interface AutoSaveOptions {
  interval?: number // in milliseconds
  onSave: () => Promise<void> | void
  onError?: (error: any) => void
  enabled?: boolean
}

export const useAutoSave = ({
  interval = 30000, // 30 seconds default
  onSave,
  onError,
  enabled = true
}: AutoSaveOptions) => {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const save = useCallback(async () => {
    if (isSaving || !enabled) return

    try {
      setIsSaving(true)
      setSaveStatus('saving')
      
      await onSave()
      
      setLastSaved(new Date())
      setSaveStatus('saved')
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
      
    } catch (error) {
      console.error('Auto-save failed:', error)
      setSaveStatus('error')
      onError?.(error)
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 5000)
    } finally {
      setIsSaving(false)
    }
  }, [isSaving, enabled, onSave, onError])

  // Manual save function
  const saveNow = useCallback(async () => {
    await save()
  }, [save])

  // Setup auto-save interval
  useEffect(() => {
    if (!enabled) return

    intervalRef.current = setInterval(save, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [save, interval, enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    isSaving,
    lastSaved,
    saveStatus,
    saveNow,
    enabled
  }
}
