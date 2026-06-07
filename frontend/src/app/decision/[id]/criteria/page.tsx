"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { saveCriteria } from "@/lib/api";
import { useDecisionStore } from "@/store/decisionStore";

// UI Components
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import StepHeader from "@/components/ui/StepHeader";

// ─── Dynamic Suggestion Engine ────────────────────────────────────────────────
//  Each entry: [keywords[], criteria[]]
//  Multiple categories can match — their criteria are merged & deduplicated.
const CRITERIA_DB: { keywords: string[]; criteria: string[] }[] = [
  {
    keywords: ["city", "move", "relocat", "live", "settle", "town", "where to stay", "location"],
    criteria: ["Cost of Living", "Safety", "Job Market", "Weather", "Lifestyle", "Public Transport", "Rent", "Healthcare", "Community", "Air Quality", "Nightlife", "Walkability"],
  },
  {
    keywords: ["job", "career", "role", "position", "employ", "startup", "firm", "mnc"],
    criteria: ["Salary", "Work-Life Balance", "Growth Potential", "Remote Work", "Company Culture", "Benefits", "Job Stability", "Location", "Learning Opportunities", "Team", "Manager Quality"],
  },
  {
    keywords: ["offer", "accept", "join", "which company"],
    criteria: ["Compensation Package", "Role Clarity", "Team Size", "Product Maturity", "Brand Reputation", "Equity / Stock", "Exit Opportunities"],
  },
  {
    keywords: ["college", "university", "school", "mba", "degree", "educat", "course", "program", "admission", "institute", "campus"],
    criteria: ["Reputation / Ranking", "Tuition Fees", "Location", "Campus Life", "Career Placement", "Faculty Quality", "Scholarships", "Research Opportunities", "Class Size", "Alumni Network", "Specializations"],
  },
  {
    keywords: ["phone", "mobile", "smartphone", "iphone", "android", "samsung", "pixel", "oneplus"],
    criteria: ["Camera Quality", "Battery Life", "Performance", "Price", "Display Quality", "Storage", "Brand Trust", "Software Updates", "Durability", "Design", "5G Support"],
  },
  {
    keywords: ["laptop", "macbook", "computer", "pc", "notebook", "chromebook"],
    criteria: ["Performance", "Battery Life", "Price", "Display Quality", "Portability", "Build Quality", "Brand", "Keyboard Feel", "Storage", "RAM", "Cooling"],
  },
  {
    keywords: ["car", "vehicle", "suv", "sedan", "ev", "motorcycle", "bike", "scooter"],
    criteria: ["Price", "Fuel Efficiency", "Safety Rating", "Reliability", "Comfort", "Performance", "Maintenance Cost", "Resale Value", "Features", "Brand", "Warranty"],
  },
  {
    keywords: ["house", "apartment", "flat", "property", "home", "villa", "plot"],
    criteria: ["Price", "Location", "Size / Area", "Safety", "Commute Distance", "Amenities", "Natural Light", "Parking", "Neighbourhood", "Condition", "Builder Reputation"],
  },
  {
    keywords: ["rent", "lease", "pg", "hostel", "accommodation"],
    criteria: ["Rent Cost", "Location", "Safety", "Furnishing", "Owner Behaviour", "Internet", "Proximity to Work", "Deposit Amount", "Maintenance"],
  },
  {
    keywords: ["travel", "vacation", "holiday", "trip", "tour", "destination", "visit"],
    criteria: ["Cost", "Weather", "Safety", "Attractions", "Food & Culture", "Accessibility", "Accommodation Quality", "Visa Ease", "Language Barrier", "Activities", "Crowd Levels"],
  },
  {
    keywords: ["country", "abroad", "immigrat", "migrate", "visa", "settle abroad", "pr"],
    criteria: ["Quality of Life", "Job Opportunities", "Cost of Living", "Healthcare", "Education", "Safety", "Language", "Culture Fit", "Climate", "Visa Process", "Community"],
  },
  {
    keywords: ["invest", "stock", "crypto", "fund", "portfolio", "saving", "asset", "wealth"],
    criteria: ["Expected Returns", "Risk Level", "Liquidity", "Diversification", "Fees / Expense Ratio", "Time Horizon", "Tax Efficiency", "Volatility", "Transparency", "Track Record"],
  },
  {
    keywords: ["software", "tool", "app", "platform", "saas", "framework", "library", "service", "subscription", "crm", "erp"],
    criteria: ["Features", "Ease of Use", "Pricing", "Performance", "Support Quality", "Integrations", "Security", "Scalability", "Documentation", "Community", "Uptime"],
  },
  {
    keywords: ["cloud", "hosting", "server", "aws", "azure", "gcp", "deploy", "infrastructure"],
    criteria: ["Cost", "Performance", "Reliability / Uptime", "Security", "Scalability", "Region Availability", "Support", "Ecosystem", "Compliance", "Migration Ease"],
  },
  {
    keywords: ["restaurant", "dining", "eatery", "food place", "where to eat"],
    criteria: ["Food Quality", "Price", "Location", "Service", "Ambiance", "Menu Variety", "Hygiene", "Wait Time", "Portion Size", "Parking"],
  },
  {
    keywords: ["food", "dish", "meal", "recipe", "cuisine", "snack", "eat", "drink", "beverage", "juice", "coffee", "tea", "wine", "beer", "alcohol", "smoothie", "chai"],
    criteria: ["Taste", "Nutrition / Health", "Price", "Availability", "Preparation Time", "Ingredients Quality", "Calories", "Suitability (Diet)", "Portion Size", "Brand"],
  },
  {
    keywords: ["camera", "dslr", "mirrorless", "lens", "photography", "videography"],
    criteria: ["Image Quality", "Video Quality", "Price", "Autofocus Speed", "Low-light Performance", "Battery Life", "Portability", "Lens Ecosystem", "Build Quality", "Brand"],
  },
  {
    keywords: ["headphone", "earphone", "earbud", "speaker", "audio", "sound", "music"],
    criteria: ["Sound Quality", "Bass", "Noise Cancellation", "Price", "Comfort", "Battery Life", "Microphone Quality", "Connectivity", "Build Quality", "Brand"],
  },
  {
    keywords: ["watch", "smartwatch", "wearable", "fitness band"],
    criteria: ["Health Tracking", "Battery Life", "Design", "Price", "App Ecosystem", "Notifications", "Water Resistance", "GPS", "Compatibility", "Brand"],
  },
  {
    keywords: ["gym", "fitness", "workout", "exercise", "yoga", "sport"],
    criteria: ["Equipment Quality", "Location / Distance", "Monthly Cost", "Trainer Quality", "Cleanliness", "Crowd Levels", "Timings", "Classes Offered", "Safety", "Atmosphere"],
  },
  {
    keywords: ["game", "gaming", "console", "pc gaming", "xbox", "playstation", "nintendo"],
    criteria: ["Performance / Frame Rate", "Game Library", "Price", "Exclusive Titles", "Online Multiplayer", "Controller Quality", "Backward Compatibility", "Community", "VR Support"],
  },
  {
    keywords: ["book", "novel", "read", "author", "fiction", "non-fiction"],
    criteria: ["Content Quality", "Writing Style", "Length", "Reviews / Ratings", "Author Credibility", "Relatability", "Price", "Genre Fit", "Pacing"],
  },
  {
    keywords: ["pet", "dog", "cat", "animal", "adopt", "breed"],
    criteria: ["Temperament", "Maintenance Cost", "Space Requirement", "Energy Level", "Health Issues", "Lifespan", "Trainability", "Compatibility with Family", "Grooming Needs"],
  },
  {
    keywords: ["partner", "relationship", "marry", "marriage", "date", "spouse"],
    criteria: ["Compatibility", "Values Alignment", "Communication", "Trust", "Emotional Support", "Life Goals", "Family Values", "Emotional Intelligence", "Financial Stability", "Shared Interests"],
  },
  {
    keywords: ["doctor", "hospital", "clinic", "health", "treatment", "medicine", "therapy"],
    criteria: ["Doctor Expertise", "Cost", "Location", "Wait Times", "Reputation", "Facilities", "Insurance Coverage", "Reviews", "Follow-up Care", "Accessibility"],
  },
];

const FALLBACK_CRITERIA = [
  "Quality", "Cost", "Ease of Use", "Reliability", "Time Required",
  "Support / Service", "Flexibility", "Impact", "Risk", "Scalability",
];

/** Extract the most meaningful noun from the title for use in the placeholder */
function extractSubject(title: string): string {
  // Strip common question words and return the first content word
  const cleaned = title
    .toLowerCase()
    .replace(/^(which|what|best|should i|where|how|is|are|the|a|an)\s+/g, "")
    .replace(/\?/g, "")
    .trim();
  // Capitalise first word
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Matches ALL categories whose keywords appear in the title,
 * merges their criteria (deduplicated), and returns up to 10.
 * Falls back to universal criteria if nothing matches.
 */
function getSuggestions(title: string): { suggestions: string[]; placeholder: string } {
  const t = title.toLowerCase();

  const matched: string[] = [];
  const seen = new Set<string>();

  for (const { keywords, criteria } of CRITERIA_DB) {
    if (keywords.some((kw) => t.includes(kw))) {
      for (const c of criteria) {
        if (!seen.has(c)) {
          seen.add(c);
          matched.push(c);
        }
      }
    }
  }

  const suggestions = matched.length >= 3 ? matched.slice(0, 10) : FALLBACK_CRITERIA;
  const placeholder  = `e.g. ${suggestions[0]}`;

  return { suggestions, placeholder };
}



// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CriteriaPage() {
  const router = useRouter();
  const params = useParams();
  const decisionId = params.id as string;
  const { decisionTitle, setCriteria } = useDecisionStore();

  const [criteriaNames, setCriteriaNames] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { suggestions, placeholder } = useMemo(
    () => getSuggestions(decisionTitle ?? ""),
    [decisionTitle]
  );

  const addCriterion = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || criteriaNames.includes(trimmed)) return;
    setCriteriaNames((prev) => [...prev, trimmed]);
    setInput("");
  };

  const remove = (name: string) =>
    setCriteriaNames((prev) => prev.filter((c) => c !== name));

  /** Bulk-add all unselected suggestions with a staggered feel */
  const handleGenerate = (pool?: string[]) => {
    const toAdd = (pool ?? suggestions).filter((s) => !criteriaNames.includes(s));
    if (!toAdd.length) return;
    setGenerating(true);
    let i = 0;
    const iv = setInterval(() => {
      if (i >= toAdd.length) { clearInterval(iv); setGenerating(false); return; }
      setCriteriaNames((prev) =>
        prev.includes(toAdd[i]) ? prev : [...prev, toAdd[i]]
      );
      i++;
    }, 80);
  };

  const handleNext = async () => {
    if (criteriaNames.length < 2) { alert("Add at least 2 criteria"); return; }
    setLoading(true);
    try {
      const res = await saveCriteria(decisionId, criteriaNames);
      setCriteria(res);
      router.push(`/decision/${decisionId}/compare`);
    } catch {
      alert("Failed to save criteria. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const visibleSuggestions = suggestions.filter((s) => !criteriaNames.includes(s));
  const hasAny = criteriaNames.length > 0;

  return (
    <main className="p-6 max-w-lg mx-auto">
      <Card>
        <StepHeader step="STEP 1 • CRITERIA" title="What factors matter most?" />

        <p className="text-[var(--text-2)] mb-6">
          Decision: <span className="font-medium text-[var(--text-1)]">{decisionTitle}</span>
        </p>

        {/* ── ✨ Generate for me banner ── */}
        {!hasAny && (
          <div
            className="rounded-2xl border p-4 mb-6 flex items-center justify-between gap-4"
            style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--accent)' }}>
                ✨ Generate for me
              </p>
              <p className="text-xs leading-snug" style={{ color: 'var(--text-2)' }}>
                Auto-fill {suggestions.length} criteria matched to your decision
              </p>
            </div>
            <button
              onClick={() => handleGenerate()}
              disabled={generating}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                         text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              {generating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding…
                </>
              ) : `Add all ${suggestions.length}`}
            </button>
          </div>
        )}

        {/* ── Manual input ── */}
        <div className="flex gap-3 mb-5">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCriterion(input)}
            placeholder={placeholder}
          />
          <Button onClick={() => addCriterion(input)}>Add</Button>
        </div>

        {/* ── Individual suggestion chips ── */}
        {visibleSuggestions.length > 0 && (
          <div className="mb-7">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                Suggested for your decision
              </p>
              {hasAny ? (
                <button
                  onClick={() => handleGenerate(visibleSuggestions)}
                  disabled={generating}
                  className="text-xs font-medium transition-opacity hover:opacity-75 disabled:opacity-50"
                  style={{ color: 'var(--accent)' }}
                >
                  {generating ? 'Adding…' : `+ Add remaining ${visibleSuggestions.length}`}
                </button>
              ) : (
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                >
                  {visibleSuggestions.length} available
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => addCriterion(s)}
                  className="text-sm border px-3 py-1.5 rounded-xl transition-all duration-150
                             hover:border-[var(--accent)] hover:text-[var(--accent)]
                             hover:bg-[var(--accent-bg)] active:scale-95"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Added criteria chips ── */}
        {criteriaNames.length > 0 && (
          <div
            className="rounded-2xl border p-5 mb-7"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                Your criteria ({criteriaNames.length})
              </p>
              <button
                onClick={() => setCriteriaNames([])}
                className="text-xs transition-opacity hover:opacity-75"
                style={{ color: 'var(--error)' }}
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {criteriaNames.map((c, i) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl border animate-fade-up"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-1)',
                    animationDelay: `${i * 30}ms`,
                  }}
                >
                  <span
                    className="text-[10px] font-mono font-bold w-4 h-4 rounded-full
                               flex items-center justify-center shrink-0"
                    style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                  >
                    {i + 1}
                  </span>
                  {c}
                  <button
                    onClick={() => remove(c)}
                    className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center
                               hover:bg-[var(--error-bg)] transition-colors text-sm leading-none"
                    style={{ color: 'var(--text-3)' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {criteriaNames.length === 1 && (
          <p className="text-center text-xs mb-4" style={{ color: 'var(--accent)' }}>
            Add at least one more criterion to continue
          </p>
        )}

        <Button
          onClick={handleNext}
          disabled={criteriaNames.length < 2 || loading}
          className="w-full py-4 text-lg"
        >
          {loading ? "Saving…" : `Continue with ${criteriaNames.length} criteria →`}
        </Button>
      </Card>
    </main>
  );
}