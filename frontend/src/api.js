import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const getHealth = () => api.get("/health").then((r) => r.data);

export const getDashboard = (filters = {}) =>
  api.get("/dashboard", { params: filters }).then((r) => r.data);

export const analyzeReport = (description) =>
  api.post("/analyze", { description }).then((r) => r.data);

export const batchAnalyze = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post("/batch-analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const getPrecursors = (filters = {}) =>
  api.get("/precursors", { params: filters }).then((r) => r.data);

export const getLocations = () => api.get("/locations").then((r) => r.data);

export const getActivities = () => api.get("/activities").then((r) => r.data);

export const getHazards = () => api.get("/hazards").then((r) => r.data);

export const getLifeSavingRules = () =>
  api.get("/life-saving-rules").then((r) => r.data);

export default api;
