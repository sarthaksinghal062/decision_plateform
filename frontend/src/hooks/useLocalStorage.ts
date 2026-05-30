// frontend/src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) setStoredValue(JSON.parse(item))
    } catch (err) {
      console.warn(`useLocalStorage read error for key "${key}":`, err)
    }
    setHydrated(true)
  }, [key])

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (err) {
      console.warn(`useLocalStorage write error for key "${key}":`, err)
    }
  }

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (err) {
      console.warn(`useLocalStorage remove error for key "${key}":`, err)
    }
  }

  return { value: storedValue, setValue, removeValue, hydrated }
}