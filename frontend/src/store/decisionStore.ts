import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Criterion {
  id: string
  name: string
  weight?: number
  position: number
  decision_id: string
}

export interface Comparison {
  criterion_a: string
  criterion_b: string
  winner: string
  preference: string
}

export interface Option {
  id: string
  name: string
  decision_id: string
  final_score?: number
}

interface DecisionStore {
  decisionId: string | null
  title: string
  step: number
  criteria: Criterion[]
  comparisons: Comparison[]
  options: Option[]
  results: any | null

  setDecisionId: (id: string) => void
  setTitle: (t: string) => void
  setCriteria: (c: Criterion[]) => void
  addComparison: (c: Comparison) => void
  setOptions: (o: Option[]) => void
  setResults: (r: any) => void
  nextStep: () => void
  prevStep: () => void
  reset: () => void
}

export const useDecisionStore = create<DecisionStore>()(
  persist(
    (set) => ({
      decisionId: null,
      title: "",
      step: 1,
      criteria: [],
      comparisons: [],
      options: [],
      results: null,

      setDecisionId: (id) => set({ decisionId: id }),
      setTitle: (title) => set({ title }),
      setCriteria: (criteria) => set({ criteria }),
      addComparison: (c) =>
        set((s) => ({ comparisons: [...s.comparisons, c] })),
      setOptions: (options) => set({ options }),
      setResults: (results) => set({ results }),
      nextStep: () => set((s) => ({ step: s.step + 1 })),
      prevStep: () => set((s) => ({ step: Math.max(1, s.step - 1) })),
      reset: () =>
        set({
          decisionId: null,
          title: "",
          step: 1,
          criteria: [],
          comparisons: [],
          options: [],
          results: null,
        }),
    }),
    {
      name: "decision-storage", // persists to localStorage — survives refresh
    }
  )
)
