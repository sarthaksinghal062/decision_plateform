// frontend/src/lib/api.ts

import axios from "axios"

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000",

  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config
    console.error("[API] Request failed:", {
      method: config?.method?.toUpperCase(),
      url: `${config?.baseURL ?? ""}${config?.url ?? ""}`,
      status: error.response?.status,
      detail: error.response?.data,
      message: error.message,
    })
    return Promise.reject(error)
  }
)

/* =========================================
   TYPES
========================================= */

export interface Decision {
  id: string
  title: string
  status?: string
  created_at?: string

  criteria_count?: number
  options_count?: number

  winner?: string | null
  winner_score?: number | null
}

/* =========================================
   DECISIONS
========================================= */

export const createDecision = async (
  title: string
) => {
  const res = await api.post(
    "/api/decisions",
    { title }
  )

  return res.data
}

export const getDecision = async (
  id: string
) => {
  const res = await api.get(
    `/api/decisions/${id}`
  )

  return res.data
}

/* =========================================
   DASHBOARD
========================================= */

export const getAllDecisions = async (): Promise<
  Decision[]
> => {
  const res = await api.get(
    "/api/decisions"
  )

  return res.data
}

export const deleteDecision = async (
  decisionId: string
): Promise<void> => {
  await api.delete(
    `/api/decisions/${decisionId}`
  )
}

/* =========================================
   CRITERIA
========================================= */

export const saveCriteria = async (
  decisionId: string,
  names: string[]
) => {
  const url = `/api/decisions/${decisionId}/criteria`
  const body = { names }
  console.info("[API] saveCriteria request:", { decisionId, names, url })

  const res = await api.post(url, body)
  console.info("[API] saveCriteria response:", { status: res.status, data: res.data })

  return res.data
}

/* =========================================
   COMPARISONS
========================================= */

export const saveComparisons = async (
  decisionId: string,
  comparisons: {
    criterion_a: string
    criterion_b: string
    winner: string
    preference: string
  }[]
) => {
  const res = await api.post(
    `/api/decisions/${decisionId}/comparisons`,
    {
      comparisons,
    }
  )

  return res.data
}

export const calculateWeights = async (
  decisionId: string
) => {
  const res = await api.post(
    `/api/decisions/${decisionId}/calculate-weights`
  )

  return res.data
}

/* =========================================
   OPTIONS
========================================= */

export const saveOptions = async (
  decisionId: string,
  names: string[]
) => {
  const res = await api.post(
    `/api/decisions/${decisionId}/options`,
    {
      names,
    }
  )

  return res.data
}

export const addOption = async (
  decisionId: string,
  name: string,
  description?: string
) => {
  const res = await api.post(
    "/options",
    {
      decision_id: decisionId,
      name,
      description: description ?? "",
    }
  )

  return res.data
}

/* =========================================
   SCORES
========================================= */

export const saveScores = async (
  decisionId: string,
  scores: {
    option_id: string
    criterion_id: string
    score: number
  }[]
) => {
  const res = await api.post(
    "/scores",
    {
      decision_id: decisionId,
      scores,
    }
  )

  return res.data
}

/* =========================================
   RATINGS
========================================= */

export const saveRatings = async (
  decisionId: string,
  ratings: object[]
) => {
  const res = await api.post(
    `/api/decisions/${decisionId}/ratings`,
    {
      ratings,
    }
  )

  return res.data
}

/* =========================================
   RESULTS
========================================= */

export const getResults = async (
  decisionId: string
) => {
  const res = await api.get(
    `/api/decisions/${decisionId}/results`
  )

  return res.data
}