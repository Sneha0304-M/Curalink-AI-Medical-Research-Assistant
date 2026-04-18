const express = require("express");
const router = express.Router();

const Session = require("../models/Session");
const { getPubMedArticles } = require("../services/pubmed");
const { getOpenAlexArticles } = require("../services/openalex");
const { getClinicalTrials } = require("../services/clinicalTrials");
const { rankPublications, rankTrials } = require("../services/ranker");
const { generateResponse, expandQuery } = require("../services/llm");

/**
 * POST /api/chat/message
 * Body: { sessionId, message, context }
 *
 * Full pipeline: retrieve → rank → LLM → respond.
 * Maintains conversation history in MongoDB.
 */
router.post("/message", async (req, res) => {
  try {
    const { sessionId, message, context } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message are required" });
    }

    // ── Load or create session ───────────────────────────────────────────────
    let session = await Session.findOne({ sessionId });
    if (!session) {
      session = new Session({ sessionId, context: context || {}, messages: [] });
    }

    // Update context if provided (e.g. user filled in the profile form)
    if (context) {
      session.context = { ...session.context, ...context };
    }

    const { disease, location } = session.context || {};

    // ── Step 1: Query expansion ──────────────────────────────────────────────
    const { searchTerms, expandedQuery } = await expandQuery(message, disease);

    // ── Step 2: Parallel data retrieval ─────────────────────────────────────
    const [pubmedRes, openAlexRes, trialsRes] = await Promise.allSettled([
      getPubMedArticles(expandedQuery, 80),
      getOpenAlexArticles(expandedQuery, 100),
      getClinicalTrials(disease || message, message, location, 50),
    ]);

    const allPublications = [
      ...(pubmedRes.status === "fulfilled" ? pubmedRes.value : []),
      ...(openAlexRes.status === "fulfilled" ? openAlexRes.value : []),
    ];
    const allTrials = trialsRes.status === "fulfilled" ? trialsRes.value : [];

    // ── Step 3: Re-rank ──────────────────────────────────────────────────────
    const publications = rankPublications(allPublications, searchTerms, 8);
    const trials = rankTrials(allTrials, searchTerms, 6);

    // ── Step 4: LLM reasoning ────────────────────────────────────────────────
    const llmResponse = await generateResponse({
      userQuery: message,
      publications,
      trials,
      context: session.context,
      conversationHistory: session.messages.slice(-6), // last 3 turns
    });

    // ── Step 5: Persist to MongoDB ───────────────────────────────────────────
    session.messages.push({ role: "user", content: message });
    session.messages.push({
      role: "assistant",
      content: llmResponse.conditionOverview || message,
      publications,
      trials,
    });

    // Keep conversation manageable (last 20 messages)
    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
    }

    await session.save();

    // ── Respond ──────────────────────────────────────────────────────────────
    res.json({
      llmResponse,
      publications,
      trials,
      meta: {
        totalRetrieved: allPublications.length + allTrials.length,
        expandedQuery,
      },
    });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat processing failed", details: err.message });
  }
});

/**
 * GET /api/chat/session/:sessionId
 * Returns the full conversation history for a session.
 */
router.get("/session/:sessionId", async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) return res.json({ messages: [], context: {} });
    res.json({ messages: session.messages, context: session.context });
  } catch (err) {
    res.status(500).json({ error: "Failed to load session" });
  }
});

/**
 * DELETE /api/chat/session/:sessionId
 * Clears conversation history (new chat).
 */
router.delete("/session/:sessionId", async (req, res) => {
  try {
    await Session.deleteOne({ sessionId: req.params.sessionId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear session" });
  }
});

module.exports = router;
