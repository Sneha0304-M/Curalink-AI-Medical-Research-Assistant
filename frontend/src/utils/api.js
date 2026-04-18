import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 60000,
});

export async function sendMessage(sessionId, message, context) {
  console.log("Sending to:", API.defaults.baseURL);
  const { data } = await API.post("/chat/message", {
    sessionId,
    message,
    context,
  });
  return data;
}

export async function loadSession(sessionId) {
  const { data } = await API.get(`/chat/session/${sessionId}`);
  return data;
}

export async function clearSession(sessionId) {
  await API.delete(`/chat/session/${sessionId}`);
}

export async function fetchResearch(query, disease, location) {
  const { data } = await API.post("/research/fetch", {
    query,
    disease,
    location,
  });
  return data;
}