import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

const fail = (error, fallback) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") throw new Error(detail);
  if (Array.isArray(detail)) throw new Error(detail.map((d) => d.msg).join(", "));
  if (!error?.response) throw new Error("Impossible de contacter le serveur. Vérifiez que le backend est actif.");
  throw new Error(fallback);
};

const get = (url, params) => api.get(url, { params }).then((r) => r.data).catch((e) => fail(e, "Erreur de chargement"));

export const predictTransaction = (payload) =>
  api.post("/predict", payload).then((r) => r.data).catch((e) => fail(e, "Analyse impossible"));

export const getDashboard = (range) => get("/dashboard/summary", range);
export const getTransaction = (id) => get(`/transactions/${id}`);
export const searchTransactions = (params) => get("/transactions/search", params);
export const handleTransaction = (id, handled = true) =>
  api.patch(`/transactions/${id}/handle`, { handled }).then((r) => r.data).catch((e) => fail(e, "Mise à jour impossible"));
export const getAlerts = (params) => get("/alerts", params);
export const getAlertCount = () => get("/alerts/count");
export const getModels = () => get("/models");
export const getReport = (range) => get("/reports/summary", range);
export const reportCsvUrl = (range) => `${API_BASE_URL}/reports/export.csv?start=${range.start}&end=${range.end}`;
export const getUsers = () => get("/users");
export const getCurrentUser = () => get("/users/me");
export const createUser = (body) => api.post("/users", body).then((r) => r.data).catch((e) => fail(e, "Création impossible"));
export const updateUser = (id, body) =>
  api.patch(`/users/${id}`, body).then((r) => r.data).catch((e) => fail(e, "Mise à jour impossible"));
export const getSettings = () => get("/settings");
export const saveThresholds = (body) =>
  api.put("/settings/thresholds", body).then((r) => r.data).catch((e) => fail(e, "Enregistrement impossible"));
export const getSystemStatus = () => get("/system/status");
