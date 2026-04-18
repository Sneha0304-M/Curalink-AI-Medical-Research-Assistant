const axios = require("axios");

const BASE = "https://clinicaltrials.gov/api/v2/studies";

/**
 * Fetch clinical trials for a disease + optional query term.
 * Fetches both RECRUITING and COMPLETED trials.
 */
async function getClinicalTrials(disease, queryTerm = "", location = "", count = 50) {
  const condition = queryTerm ? `${disease} ${queryTerm}` : disease;
  const statuses = ["RECRUITING", "COMPLETED", "ACTIVE_NOT_RECRUITING"];
  const results = [];

  for (const status of statuses) {
    try {
      const params = {
        "query.cond": condition,
        "filter.overallStatus": status,
        pageSize: Math.ceil(count / statuses.length),
        format: "json",
        fields:
          "NCTId,BriefTitle,OverallStatus,EligibilityCriteria,LocationFacility,LocationCity,LocationCountry,CentralContactName,CentralContactPhone,CentralContactEMail,BriefSummary,StartDate,PrimaryCompletionDate",
      };

      if (location) {
        params["query.locn"] = location;
      }

      const { data } = await axios.get(BASE, { params, timeout: 15000 });
      const studies = data?.studies || [];

      studies.forEach((s) => {
        const proto = s?.protocolSection;
        const id = proto?.identificationModule;
        const status = proto?.statusModule;
        const eligibility = proto?.eligibilityModule;
        const contacts = proto?.contactsLocationsModule;
        const desc = proto?.descriptionModule;

        // Extract locations
        const locations = (contacts?.locations || [])
          .slice(0, 3)
          .map((l) => [l.facility, l.city, l.country].filter(Boolean).join(", "));

        // Central contact
        const central = contacts?.centralContacts?.[0];

        results.push({
          nctId: id?.nctId || "",
          title: id?.briefTitle || "Untitled Trial",
          status: status?.overallStatus || "Unknown",
          summary: desc?.briefSummary || "No summary available.",
          eligibility: eligibility?.eligibilityCriteria || "See trial listing for criteria.",
          locations: locations.length ? locations : ["Location not specified"],
          contact: central
            ? {
                name: central.name || "",
                phone: central.phone || "",
                email: central.eMail || "",
              }
            : null,
          startDate: status?.startDateStruct?.date || "",
          url: id?.nctId
            ? `https://clinicaltrials.gov/study/${id.nctId}`
            : "",
        });
      });
    } catch (err) {
      console.error(`ClinicalTrials (${status}) error:`, err.message);
    }
  }

  return results;
}

module.exports = { getClinicalTrials };
