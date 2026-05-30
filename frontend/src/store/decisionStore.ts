// frontend/src/store/decisionStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Criterion {
  id: string
  name: string
  weight?: number
  position?: number
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
  description?: string
  final_score?: number
}

export interface ScoreEntry {
  option_id: string
  criterion_id: string
  score: number
}

export interface CriterionWeight {
  id: string
  name: string
  weight: number
}

export interface OptionResult {
  id: string
  name: string
  final_score: number
  rank: number
  scores_by_criterion: Record<string, number>
}

export interface Results {
  decision_id: string
  decision_title: string
  ranked_options: OptionResult[]
  criteria_weights: CriterionWeight[]
}

// ─── Store shape ──────────────────────────────────────────────────────────────

interface DecisionState {
  // Core
  decisionId:    string | null
  decisionTitle: string
  step:          number          // 1–5

  // Wizard data
  criteria:    Criterion[]
  comparisons: Comparison[]
  weights:     CriterionWeight[]
  options:     Option[]
  scores:      ScoreEntry[]
  results:     Results | null

  // ─── Actions ───────────────────────────────────────────────────────────────

  // Step 1 — Create decision
  setDecision: (id: string, title: string) => void

  // Step 1 — Criteria
  setCriteria: (criteria: Criterion[]) => void

  // Step 2 — Comparisons + AHP weights
  setComparisons: (comparisons: Comparison[], weights: CriterionWeight[]) => void

  // Step 3 — Options
  setOptions: (options: Option[]) => void

  // Step 4 — Scores
  setScores: (scores: ScoreEntry[]) => void

  // Step 5 — Results
  setResults: (results: Results) => void

  // Navigation
  setStep: (step: number) => void
  goToStep: (step: number) => void

  // Utility
  reset: () => void
  canResume: () => boolean
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE = {
  decisionId:    null,
  decisionTitle: '',
  step:          1,
  criteria:      [],
  comparisons:   [],
  weights:       [],
  options:       [],
  scores:        [],
  results:       null,
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useDecisionStore = create<DecisionState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── Step 1: Start a new decision ─────────────────────────────────────
      setDecision: (id, title) =>
        set({
          decisionId:    id,
          decisionTitle: title,
          step:          1,
          // Reset downstream data when starting fresh
          criteria:    [],
          comparisons: [],
          weights:     [],
          options:     [],
          scores:      [],
          results:     null,
        }),

      // ── Step 1: Save criteria ────────────────────────────────────────────
      setCriteria: (criteria) =>
        set({ criteria, step: Math.max(get().step, 2) }),

      // ── Step 2: Save comparisons + AHP weights ───────────────────────────
      setComparisons: (comparisons, weights) =>
        set({ comparisons, weights, step: Math.max(get().step, 3) }),

      // ── Step 3: Save options ─────────────────────────────────────────────
      setOptions: (options) =>
        set({ options, step: Math.max(get().step, 4) }),

      // ── Step 4: Save scores ──────────────────────────────────────────────
      setScores: (scores) =>
        set({ scores, step: Math.max(get().step, 5) }),

      // ── Step 5: Save results ─────────────────────────────────────────────
      setResults: (results) =>
        set({ results, step: 5 }),

      // ── Navigation ───────────────────────────────────────────────────────
      setStep: (step) => set({ step }),

      goToStep: (step) => set({ step }),

      // ── Full reset (for "New Decision") ──────────────────────────────────
      reset: () => set(INITIAL_STATE),

      // ── Can the user resume a decision? ──────────────────────────────────
      canResume: () => {
        const { decisionId, step } = get()
        return !!decisionId && step > 1
      },
    }),

    {
      name:    'decision-storage',           // localStorage key
      storage: createJSONStorage(() => localStorage),

      // Only persist these fields (skip transient UI state if any)
      partialize: (state) => ({
        decisionId:    state.decisionId,
        decisionTitle: state.decisionTitle,
        step:          state.step,
        criteria:      state.criteria,
        comparisons:   state.comparisons,
        weights:       state.weights,
        options:       state.options,
        scores:        state.scores,
        results:       state.results,
      }),
    }
  )
)