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
  console.log(
    `[api] saveCriteria → POST /api/decisions/${decisionId}/criteria`,
    { names },
  );

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
  console.log(
    `[api] saveComparisons → POST /api/decisions/${decisionId}/comparisons`,
    {
      count: comparisons.length,
    },
  );

  const res = await api.post(`/api/decisions/${decisionId}/comparisons`, {
    comparisons,
  });

  return res.data;
};

export const calculateWeights = async (decisionId: string) => {
  console.log(
    `[api] calculateWeights → POST /api/decisions/${decisionId}/calculate-weights`,
  );

  const res = await api.post(`/api/decisions/${decisionId}/calculate-weights`);

  return res.data;
};

/* =========================================
   OPTIONS
========================================= */

export const saveOptions = async (decisionId: string, names: string[]) => {
  console.log(`[api] saveOptions → POST /api/decisions/${decisionId}/options`, {
    names,
  });

  const res = await api.post(`/api/decisions/${decisionId}/options`, {
    names,
  });

  return res.data;
};

export const addOption = async (
  decisionId: string,
  name: string,
  _description?: string,
) => {
  void _description;

  console.log(`[api] addOption → POST /api/decisions/${decisionId}/options`, {
    name,
  });

  const res = await api.post(`/api/decisions/${decisionId}/options`, {
    names: [name],
  });

  const options = res.data;

  return Array.isArray(options) ? options[0] : options;
};

/* =========================================
   SCORES
   (proxied to /ratings backend route)
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
  console.log(`[api] saveRatings → POST /api/decisions/${decisionId}/ratings`, {
    count: ratings.length,
  });

  const res = await api.post(`/api/decisions/${decisionId}/ratings`, {
    ratings,
  });

  return res.data;
};

/* =========================================
   RESULTS
========================================= */

export const getResults = async (decisionId: string) => {
  console.log(`[api] getResults → GET /api/decisions/${decisionId}/results`);

  const res = await api.get(`/api/decisions/${decisionId}/results`);

  const data = res.data;

  // Normalize backend response
  const rankedOptions = (data.ranking || []).map(
    (
      r: {
        option_id: string;
        name: string;
        score: number;
        breakdown?: Record<string, unknown>;
      },
      index: number,
    ) => ({
      id: r.option_id,
      name: r.name,
      final_score: r.score,
      rank: index + 1,
      scores_by_criterion: r.breakdown || {},
    }),
  );

  return {
    decision_id: decisionId,

    decision_title: data.decision_title || "Decision Results",

    ranked_options: rankedOptions,

    criteria_weights: (data.weights || []).map(
      (w: { criterion_id: string; criterion: string; weight: number }) => ({
        id: w.criterion_id,
        name: w.criterion,
        weight: w.weight,
      }),
    ),

    winner: data.winner || rankedOptions[0] || null,
  };
};

/* =========================================
   GLOBAL API ERROR LOGGER
========================================= */

api.interceptors.response.use(
  (response) => response,

  (error) => {
    console.error("[API Error]", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });

    return Promise.reject(error);
  },
);

export default api;
