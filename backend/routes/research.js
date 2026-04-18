const express = require("express");
const router = express.Router();

const { getPubMedArticles } = require("../services/pubmed");
const { getOpenAlexArticles } = require("../services/openalex");
const { getClinicalTrials } = require("../services/clinicalTrials");
const { rankPublications, rankTrials } = require("../services/ranker");
const { expandQuery } = require("../services/llm");

/**
 * POST /api/research/fetch
 * Body: { query, disease, location }
 *
 * Runs the full retrieval + ranking pipeline.
 * Returns top publications and clinical trials.
 */
router.post("/fetch", async (req, res) => {
  try {
    const { query, disease, location } = req.body;

    if (!query && !disease) {
      return res.status(400).json({ error: "query or disease is required" });
    }

    // Step 1: Expand the query intelligently using LLM
    const { searchTerms, expandedQuery } = await expandQuery(query, disease);
    console.log("🔍 Expanded query:", expandedQuery, "| Terms:", searchTerms);

    // Step 2: Fan out to all 3 data sources simultaneously
    const [pubmedResults, openAlexResults, trialResults] = await Promise.allSettled([
      getPubMedArticles(expandedQuery, 80),
      getOpenAlexArticles(expandedQuery, 100),
      getClinicalTrials(disease || query, query, location, 50),
    ]);

    const publications = [
      ...(pubmedResults.status === "fulfilled" ? pubmedResults.value : []),
      ...(openAlexResults.status === "fulfilled" ? openAlexResults.value : []),
    ];

    const trials =
      trialResults.status === "fulfilled" ? trialResults.value : [];

    console.log(
      `📚 Retrieved: ${publications.length} publications, ${trials.length} trials`
    );

    // Step 3: Re-rank and filter to top results
    const topPublications = rankPublications(publications, searchTerms, 8);
    const topTrials = rankTrials(trials, searchTerms, 6);

    console.log(
      `✅ After ranking: ${topPublications.length} publications, ${topTrials.length} trials`
    );

    res.json({
      publications: topPublications,
      trials: topTrials,
      meta: {
        totalPublications: publications.length,
        totalTrials: trials.length,
        expandedQuery,
        searchTerms,
      },
    });
  } catch (err) {
    console.error("Research fetch error:", err);
    res.status(500).json({ error: "Research retrieval failed", details: err.message });
  }
});

module.exports = router;
