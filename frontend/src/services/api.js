import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const api = axios.create({ baseURL: API_BASE_URL });

export const predictTransaction = (transaction) =>
  api.post("/predict", transaction).then((res) => res.data);

export const getTransactions = (limit = 50) =>
  api.get(`/transactions?limit=${limit}`).then((res) => res.data);

export const getStatistics = () =>
  api.get("/statistics").then((res) => res.data);