import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
})

export const createDecision = (title: string) =>
  api.post("/api/decisions", { title })

export const getDecision = (id: string) =>
  api.get(`/api/decisions/${id}`)

export const saveCriteria = (decisionId: string, names: string[]) =>
  api.post(`/api/decisions/${decisionId}/criteria`, { names })

export const saveComparisons = (decisionId: string, comparisons: object[]) =>
  api.post(`/api/decisions/${decisionId}/comparisons`, { comparisons })

export const calculateWeights = (decisionId: string) =>
  api.post(`/api/decisions/${decisionId}/calculate-weights`)

export const saveOptions = (decisionId: string, names: string[]) =>
  api.post(`/api/decisions/${decisionId}/options`, { names })

export const saveRatings = (decisionId: string, ratings: object[]) =>
  api.post(`/api/decisions/${decisionId}/ratings`, { ratings })

export const getResults = (decisionId: string) =>
  api.get(`/api/decisions/${decisionId}/results`)