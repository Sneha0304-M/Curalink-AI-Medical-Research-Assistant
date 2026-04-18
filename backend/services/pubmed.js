const axios = require("axios");
const xml2js = require("xml2js");

const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

/**
 * Search PubMed and return up to `retmax` article IDs.
 */
async function searchPubMed(query, retmax = 80) {
  const url = `${BASE}/esearch.fcgi`;
  const { data } = await axios.get(url, {
    params: { db: "pubmed", term: query, retmax, sort: "pub date", retmode: "json" },
    timeout: 15000,
  });
  return data.esearchresult?.idlist || [];
}

/**
 * Fetch full article details for a list of PubMed IDs.
 * Returns parsed articles with title, abstract, authors, year, url.
 */
async function fetchPubMedDetails(ids) {
  if (!ids.length) return [];

  const url = `${BASE}/efetch.fcgi`;
  const { data: xml } = await axios.get(url, {
    params: { db: "pubmed", id: ids.join(","), retmode: "xml" },
    timeout: 20000,
  });

  const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false });
  const articles = parsed?.PubmedArticleSet?.PubmedArticle;
  if (!articles) return [];

  // Normalise to array
  const list = Array.isArray(articles) ? articles : [articles];

  return list.map((item) => {
    const medline = item?.MedlineCitation;
    const article = medline?.Article;

    // Authors
    const authorList = article?.AuthorList?.Author;
    const authors = authorList
      ? (Array.isArray(authorList) ? authorList : [authorList])
          .map((a) => [a.ForeName, a.LastName].filter(Boolean).join(" "))
          .slice(0, 5)
      : [];

    // Publication year
    const year =
      medline?.DateRevised?.Year ||
      article?.Journal?.JournalIssue?.PubDate?.Year ||
      "N/A";

    const pmid = medline?.PMID?._ || medline?.PMID || "";

    return {
      source: "PubMed",
      title: article?.ArticleTitle || "Untitled",
      abstract: article?.Abstract?.AbstractText || "No abstract available.",
      authors,
      year,
      url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null,
      pmid,
    };
  }).filter((a) => a.title !== "Untitled");
}

/**
 * Main export: search + fetch in one call.
 */
async function getPubMedArticles(query, count = 80) {
  try {
    const ids = await searchPubMed(query, count);
    return await fetchPubMedDetails(ids.slice(0, 60)); // cap fetch at 60
  } catch (err) {
    console.error("PubMed error:", err.message);
    return [];
  }
}

module.exports = { getPubMedArticles };
