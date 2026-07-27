import { useCallback, useEffect, useRef, useState } from 'react'
import type { CibellyActivity } from '@/lib/cibelly/sessionTypes'

type ActivityInput = Omit<CibellyActivity, 'id' | 'em'>

export function useCibellyActivity() {
  const [activity, setActivity] = useState<CibellyActivity[]>([])
  const activityRef = useRef<CibellyActivity[]>([])
  const flushRef = useRef(0)
  const sequenceRef = useRef(0)

  const publish = useCallback(() => {
    if (flushRef.current) return
    flushRef.current = window.setTimeout(() => {
      flushRef.current = 0
      setActivity(activityRef.current.filter(item => item.texto))
    }, 150)
  }, [])

  const reserveUserSpeech = useCallback((itemId: string) => {
    activityRef.current = [
      ...activityRef.current,
      {
        id: ++sequenceRef.current,
        em: Date.now(),
        tipo: 'dentista',
        texto: '',
        itemId,
      },
    ]
  }, [])

  const fillUserSpeech = useCallback((itemId: string, text: string) => {
    const index = activityRef.current.findIndex(
      item => item.itemId === itemId && !item.texto,
    )
    activityRef.current = index === -1
      ? [
        ...activityRef.current,
        {
          id: ++sequenceRef.current,
          em: Date.now(),
          tipo: 'dentista',
          texto: text,
        },
      ]
      : activityRef.current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, texto: text } : item)
  }, [])

  const register = useCallback((item: ActivityInput) => {
    activityRef.current = [
      ...activityRef.current,
      { ...item, id: ++sequenceRef.current, em: Date.now() },
    ]
    if (flushRef.current) return
    flushRef.current = window.setTimeout(() => {
      flushRef.current = 0
      setActivity(activityRef.current)
    }, 150)
  }, [])

  const clear = useCallback(() => {
    activityRef.current = []
    setActivity([])
  }, [])

  useEffect(() => () => {
    if (flushRef.current) window.clearTimeout(flushRef.current)
  }, [])

  return {
    activity,
    clear,
    fillUserSpeech,
    publish,
    register,
    reserveUserSpeech,
  }
}
