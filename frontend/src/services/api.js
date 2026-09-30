import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const api = axios.create({ baseURL: API_BASE_URL, timeout: 5000 });

export const predictTransaction = async (transaction) => {
  try {
    const res = await api.post("/predict", transaction);
    return res.data;
  } catch (error) {
    throw new Error("Impossible de contacter le serveur d'analyse. Verifiez que le backend est actif.");
  }
};

export const getTransactions = async (limit = 50) => {
  try {
    const res = await api.get(`/transactions?limit=${limit}`);
    return res.data;
  } catch (error) {
    return [];
  }
};

export const getStatistics = async () => {
  try {
    const res = await api.get("/statistics");
    return res.data;
  } catch (error) {
    return { total_transactions: 0, total_fraud_detected: 0, fraud_rate_percent: 0 };
  }
};