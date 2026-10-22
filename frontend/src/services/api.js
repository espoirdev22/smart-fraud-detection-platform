import axios from "axios";
import { clearToken, getToken, setToken } from "../lib/auth";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

// Ajoute le badge a chaque requete.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si le serveur dit "401" (badge absent, expire ou refuse) : on jette le badge et on previent l'application.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };
api.interceptors.response.use(
  (r) => r,
  (error) => {
    const isLogin = error?.config?.url?.includes("/auth/login");
    if (error?.response?.status === 401 && !isLogin) {
      clearToken();
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

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
// Un simple lien <a> ne peut pas envoyer le badge : on telecharge le CSV avec axios puis on le sauvegarde.
export const downloadReportCsv = async (range) => {
  try {
    const r = await api.get("/reports/export.csv", { params: { start: range.start, end: range.end }, responseType: "blob" });
    const url = URL.createObjectURL(r.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-fraudguard-${range.start}-${range.end}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    fail(e, "Export impossible");
  }
};
export const getUsers = () => get("/users");
export const getCurrentUser = () => get("/auth/me");
export const login = async (email, password) => {
  const data = await api.post("/auth/login", { email, password }).then((r) => r.data)
    .catch((e) => fail(e, "Connexion impossible"));
  setToken(data.access_token);
  return data.user;
};
export const changePassword = (current_password, new_password) =>
  api.post("/auth/change-password", { current_password, new_password }).then((r) => r.data)
    .catch((e) => fail(e, "Changement impossible"));
export const createUser = (body) => api.post("/users", body).then((r) => r.data).catch((e) => fail(e, "Création impossible"));
export const updateUser = (id, body) =>
  api.patch(`/users/${id}`, body).then((r) => r.data).catch((e) => fail(e, "Mise à jour impossible"));
export const getSettings = () => get("/settings");
export const saveThresholds = (body) =>
  api.put("/settings/thresholds", body).then((r) => r.data).catch((e) => fail(e, "Enregistrement impossible"));
export const getSystemStatus = () => get("/system/status");
