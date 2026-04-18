const axios = require("axios");

const BASE = "https://api.openalex.org/works";

/**
 * Fetch works from OpenAlex.
 * Retrieves up to `total` results across multiple pages.
 */
async function getOpenAlexArticles(query, total = 100) {
  const perPage = 50; // OpenAlex max reasonable per page
  const pages = Math.ceil(total / perPage);
  const results = [];

  for (let page = 1; page <= pages; page++) {
    try {
      const { data } = await axios.get(BASE, {
        params: {
          search: query,
          "per-page": perPage,
          page,
          sort: "relevance_score:desc",
          filter: "from_publication_date:2018-01-01",
        },
        headers: { "User-Agent": "Curalink/1.0 (mailto:curalink@example.com)" },
        timeout: 15000,
      });

      const works = data?.results || [];
      if (!works.length) break;

      works.forEach((work) => {
        // Authors
        const authors = (work.authorships || [])
          .slice(0, 5)
          .map((a) => a.author?.display_name)
          .filter(Boolean);

        // Abstract: OpenAlex stores it as inverted index — reconstruct it
        let abstract = "No abstract available.";
        if (work.abstract_inverted_index) {
          abstract = reconstructAbstract(work.abstract_inverted_index);
        }

        results.push({
          source: "OpenAlex",
          title: work.display_name || work.title || "Untitled",
          abstract,
          authors,
          year: work.publication_year || "N/A",
          url: work.doi ? `https://doi.org/${work.doi}` : work.id,
          citationCount: work.cited_by_count || 0,
        });
      });
    } catch (err) {
      console.error(`OpenAlex page ${page} error:`, err.message);
      break;
    }
  }

  return results;
}

/**
 * OpenAlex stores abstracts as an inverted index: { word: [positions] }.
 * This reconstructs the original sentence.
 */
function reconstructAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== "object") return "";

  const positions = {};
  for (const [word, locs] of Object.entries(invertedIndex)) {
    locs.forEach((pos) => (positions[pos] = word));
  }

  const maxPos = Math.max(...Object.keys(positions).map(Number));
  return Array.from({ length: maxPos + 1 }, (_, i) => positions[i] || "")
    .join(" ")
    .trim();
}

module.exports = { getOpenAlexArticles };
