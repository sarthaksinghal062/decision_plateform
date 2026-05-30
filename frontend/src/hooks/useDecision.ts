// frontend/src/hooks/useDecision.ts
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDecisionStore } from '@/store/decisionStore'

/**
 * Use this at the top of every wizard page.
 * - Guards: if no decisionId, redirects home
 * - Handles hydration (prevents SSR mismatch)
 * - Returns store values typed and ready
 */
export function useDecision(requiredStep?: number) {
  const router  = useRouter()
  const store   = useDecisionStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return

    // No decision started → send home
    if (!store.decisionId) {
      router.replace('/')
      return
    }

    // Required step not reached → send back
    if (requiredStep && store.step < requiredStep) {
      const stepRoutes: Record<number, string> = {
        1: `/decision/${store.decisionId}/criteria`,
        2: `/decision/${store.decisionId}/compare`,
        3: `/decision/${store.decisionId}/options`,
        4: `/decision/${store.decisionId}/score`,
        5: `/decision/${store.decisionId}/results`,
      }
      router.replace(stepRoutes[requiredStep - 1] ?? '/')
    }
  }, [hydrated, store.decisionId, store.step, requiredStep, router])

  return {
    hydrated,
    decisionId:    store.decisionId,
    decisionTitle: store.decisionTitle,
    step:          store.step,
    criteria:      store.criteria,
    comparisons:   store.comparisons,
    weights:       store.weights,
    options:       store.options,
    scores:        store.scores,
    results:       store.results,
    setDecision:   store.setDecision,
    setCriteria:   store.setCriteria,
    setComparisons:store.setComparisons,
    setOptions:    store.setOptions,
    setScores:     store.setScores,
    setResults:    store.setResults,
    reset:         store.reset,
  }
}