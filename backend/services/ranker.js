/**
 * Re-ranking pipeline.
 *
 * Scoring factors:
 *  - Recency: newer publications score higher
 *  - Keyword relevance: title/abstract contains query terms
 *  - Citation count (OpenAlex only): boosts highly-cited papers
 *  - Source credibility weights: PubMed slightly > OpenAlex for medical
 */

const CURRENT_YEAR = new Date().getFullYear();

// ── Publications ─────────────────────────────────────────────────────────────

function scorePublication(pub, queryTerms) {
  let score = 0;

  // 1. Recency (max 30 pts)
  const year = parseInt(pub.year) || 2000;
  const age = CURRENT_YEAR - year;
  score += Math.max(0, 30 - age * 2);

  // 2. Title relevance (max 40 pts)
  const titleLower =String(pub.title || "").toLowerCase()
  queryTerms.forEach((term) => {
    if (titleLower.includes(String(term.toLowerCase()))) score += 10;
  });

  // 3. Abstract relevance (max 20 pts)
  const abstractLower = String(pub.abstract || "").toLowerCase();
  queryTerms.forEach((term) => {
    if (abstractLower.includes(String(term.toLowerCase()))) score += 5;
  });

  // 4. Citation count boost (OpenAlex, max 20 pts)
  if (pub.citationCount) {
    score += Math.min(20, Math.log10(pub.citationCount + 1) * 8);
  }

  // 5. Source credibility
  if (pub.source === "PubMed") score += 5;

  // 6. Has a real URL
  if (pub.url) score += 3;

  // 7. Has meaningful abstract
  if (pub.abstract && pub.abstract.length > 100) score += 5;

  return score;
}

function rankPublications(publications, queryTerms, topN = 8) {
  // Deduplicate by title similarity
  const seen = new Set();
  const deduped = publications.filter((pub) => {
    const key = String(pub.title || "").toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped
    .map((pub) => ({ ...pub, _score: scorePublication(pub, queryTerms) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, topN)
    .map(({ _score, ...pub }) => pub); // strip internal score
}

// ── Clinical Trials ──────────────────────────────────────────────────────────

function scoreTrial(trial, queryTerms) {
  let score = 0;

  // Recruiting status priority
  const statusPriority = {
    RECRUITING: 40,
    ACTIVE_NOT_RECRUITING: 25,
    COMPLETED: 15,
    UNKNOWN: 5,
  };
  score += statusPriority[trial.status] || 5;

  // Title relevance
  const titleLower = String(trial.title || "").toLowerCase();
  queryTerms.forEach((term) => {
    if (titleLower.includes(String(term.toLowerCase()))) score += 10;
  });

  // Has contact info
  if (trial.contact?.email || trial.contact?.phone) score += 10;

  // Has real locations
  if (trial.locations?.length && trial.locations[0] !== "Location not specified") {
    score += 8;
  }

  // Eligibility details present
  if (trial.eligibility && trial.eligibility.length > 50) score += 5;

  return score;
}

function rankTrials(trials, queryTerms, topN = 6) {
  const seen = new Set();
  const deduped = trials.filter((t) => {
    if (seen.has(t.nctId)) return false;
    seen.add(t.nctId);
    return true;
  });

  return deduped
    .map((t) => ({ ...t, _score: scoreTrial(t, queryTerms) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, topN)
    .map(({ _score, ...t }) => t);
}

module.exports = { rankPublications, rankTrials };
