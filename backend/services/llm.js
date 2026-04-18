const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildSystemPrompt(context) {
  const { disease, patientName, location } = context || {};
  return `You are Curalink, an expert AI medical research assistant.
${patientName ? `You are helping ${patientName} — address them by name in your response.` : ""}
${disease ? `Their primary condition of interest is: ${disease}. Tailor ALL insights to this condition.` : ""}
${location ? `They are located in: ${location}. Mention location-relevant trials when available.` : ""}

CRITICAL RULES:
1. NEVER hallucinate or invent studies, authors, or data not provided to you.
2. Always cite provided research — reference exact titles and sources.
3. Be SPECIFIC to the patient's condition — no generic answers ever.
4. ${patientName ? `Always use "${patientName}" by name at least once in personalizedAdvice.` : "Be warm and personal."}
5. Always recommend consulting a healthcare professional for medical decisions.

You MUST respond in this exact JSON format (raw JSON only, no markdown):
{
  "conditionOverview": "2-3 sentence overview specific to the query and condition",
  "researchInsights": [
    {
      "finding": "Specific key finding from the provided research",
      "source": "Exact publication title (Source, Year)",
      "significance": "Why this matters specifically for this patient's condition"
    }
  ],
  "trialHighlights": [
    {
      "trial": "Exact trial title",
      "status": "RECRUITING or COMPLETED etc",
      "relevance": "Why this trial is directly relevant to the patient"
    }
  ],
  "personalizedAdvice": "${patientName ? `Start with '${patientName},' and give` : "Give"} 2-3 sentences of personalized context based on their condition${location ? ` and location (${location})` : ""}",
  "disclaimer": "This information is for research purposes only. Consult a qualified healthcare provider before making any medical decisions.",
  "followUpSuggestions": ["Specific follow-up question 1 relevant to condition", "Specific follow-up question 2"]
}`;
}

function buildUserPrompt(userQuery, publications, trials, conversationHistory) {
  const pubSummaries = publications.slice(0, 8).map((p, i) =>
    `[PUB ${i + 1}] "${p.title}" (${p.source}, ${p.year})
Authors: ${p.authors?.join(", ") || "Unknown"}
Abstract: ${(p.abstract || "").slice(0, 400)}...`
  ).join("\n\n");

  const trialSummaries = trials.slice(0, 6).map((t, i) =>
    `[TRIAL ${i + 1}] "${t.title}"
Status: ${t.status}
Summary: ${(t.summary || "").slice(0, 300)}
Location: ${t.locations?.slice(0, 2).join("; ")}`
  ).join("\n\n");

  const historyText = conversationHistory.length > 0
    ? `\nCONVERSATION HISTORY:\n${conversationHistory.slice(-4).map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}\n`
    : "";

  return `${historyText}
USER QUERY: "${userQuery}"

RETRIEVED PUBLICATIONS (${publications.length} total, showing top 8):
${pubSummaries || "No publications retrieved."}

RETRIEVED CLINICAL TRIALS (${trials.length} total, showing top 6):
${trialSummaries || "No trials retrieved."}

Generate a structured JSON response. Be specific, cite the exact provided research, and personalize to the patient context.`;
}

async function generateResponse({ userQuery, publications, trials, context, conversationHistory = [] }) {
  const systemPrompt = buildSystemPrompt(context);
  const userPrompt = buildUserPrompt(userQuery, publications, trials, conversationHistory);

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1800,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    return JSON.parse(raw);
  } catch (err) {
    console.error("Groq LLM error:", err.message);
    return {
      conditionOverview: "Unable to generate AI analysis at this time.",
      researchInsights: [],
      trialHighlights: [],
      personalizedAdvice: "Please review the research results in the panel on the right.",
      disclaimer: "This information is for research purposes only. Consult a qualified healthcare provider before making any medical decisions.",
      followUpSuggestions: [],
    };
  }
}

async function expandQuery(userQuery, disease) {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a medical search expert. Output ONLY a JSON object:
{
  "searchTerms": ["term1", "term2", "term3"],
  "expandedQuery": "optimized single search string for PubMed/OpenAlex"
}
Combine the disease + query intelligently. Max 5 terms. Be medically precise.`,
        },
        { role: "user", content: `Disease: "${disease || "general"}"\nUser query: "${userQuery}"` },
      ],
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return {
      searchTerms: result.searchTerms || [userQuery],
      expandedQuery: result.expandedQuery || `${userQuery} ${disease || ""}`.trim(),
    };
  } catch {
    return {
      searchTerms: [userQuery, disease].filter(Boolean),
      expandedQuery: `${userQuery} ${disease || ""}`.trim(),
    };
  }
}

module.exports = { generateResponse, expandQuery };
