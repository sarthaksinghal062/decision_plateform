// frontend/src/lib/api.ts

import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",

  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================
   TYPES
========================================= */

export interface Decision {
  id: string;
  title: string;
  status?: string;
  created_at?: string;

  criteria_count?: number;
  options_count?: number;

  winner?: string | null;
  winner_score?: number | null;
}

/* =========================================
   DECISIONS
========================================= */

export const createDecision = async (title: string) => {
  const res = await api.post("/api/decisions", { title });

  return res.data;
};

export const getDecision = async (id: string) => {
  const res = await api.get(`/api/decisions/${id}`);

  return res.data;
};

/* =========================================
   DASHBOARD
========================================= */

export const getAllDecisions = async (): Promise<Decision[]> => {
  const res = await api.get("/api/decisions");

  return res.data;
};

export const deleteDecision = async (decisionId: string): Promise<void> => {
  await api.delete(`/api/decisions/${decisionId}`);
};

/* =========================================
   CRITERIA
========================================= */

export const saveCriteria = async (decisionId: string, names: string[]) => {
  const res = await api.post(`/api/decisions/${decisionId}/criteria`, {
    names,
  });

  return res.data;
};

/* =========================================
   COMPARISONS
========================================= */

export const saveComparisons = async (
  decisionId: string,
  comparisons: {
    criterion_a: string;
    criterion_b: string;
    winner: string;
    preference: string;
  }[],
) => {
  const res = await api.post(`/api/decisions/${decisionId}/comparisons`, {
    comparisons,
  });

  return res.data;
};

export const calculateWeights = async (decisionId: string) => {
  const res = await api.post(`/api/decisions/${decisionId}/calculate-weights`);

  return res.data;
};

/* =========================================
   OPTIONS
========================================= */

export const saveOptions = async (decisionId: string, names: string[]) => {
  const res = await api.post(`/api/decisions/${decisionId}/options`, {
    names,
  });

  return res.data;
};

export const addOption = async (
  decisionId: string,
  name: string,
  _description?: string, // kept for call-site compatibility; backend ignores descriptions
) => {
  void _description;
  console.log(`[api] addOption → POST /api/decisions/${decisionId}/options`, {
    name,
  });
  const res = await api.post(`/api/decisions/${decisionId}/options`, {
    names: [name],
  });
  // Backend returns an array; return the first (and only) element
  const options = res.data;
  return Array.isArray(options) ? options[0] : options;
};

/* =========================================
   SCORES  (proxies to /ratings on backend)
========================================= */

export const saveScores = async (
  decisionId: string,
  scores: {
    option_id: string;
    criterion_id: string;
    score: number;
  }[],
) => {
  console.log(`[api] saveScores → POST /api/decisions/${decisionId}/ratings`, {
    count: scores.length,
  });
  const res = await api.post(`/api/decisions/${decisionId}/ratings`, {
    ratings: scores,
  });

  return res.data;
};

/* =========================================
   RATINGS
========================================= */

export const saveRatings = async (decisionId: string, ratings: object[]) => {
  const res = await api.post(`/api/decisions/${decisionId}/ratings`, {
    ratings,
  });

  return res.data;
};

/* =========================================
   RESULTS
========================================= */

export const getResults = async (decisionId: string) => {
  const res = await api.get(`/api/decisions/${decisionId}/results`);

  return res.data;
};
