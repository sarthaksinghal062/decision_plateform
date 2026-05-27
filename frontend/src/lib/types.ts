export interface Decision {
  id: string
  title: string
  status: "draft" | "comparing" | "rating" | "complete"
  created_at: string
}

export interface Criterion {
  id: string
  decision_id: string
  name: string
  weight?: number
  position: number
}

export interface Comparison {
  criterion_a: string
  criterion_b: string
  winner: string
  preference: "equal" | "slightly" | "moderately" | "strongly" | "extremely"
}

export interface Option {
  id: string
  decision_id: string
  name: string
  final_score?: number
}

export interface Rating {
  option_id: string
  criterion_id: string
  score: number  // 1–10
}

export interface Result {
  winner: { name: string; score: number }
  ranking: {
    rank: number
    name: string
    score: number
    breakdown: Record<string, number>
  }[]
  weights: { criterion: string; weight: number }[]
  consistency_ratio: number
  explanation: string
}