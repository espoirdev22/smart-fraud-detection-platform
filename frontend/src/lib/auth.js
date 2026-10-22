// Le "badge" de connexion est garde dans le navigateur.
// Les acces sont proteges par try/catch : en navigation privee le stockage peut etre refuse.
const KEY = "fraudguard_token";

export const getToken = () => {
  try { return localStorage.getItem(KEY); } catch { return null; }
};
export const setToken = (token) => {
  try { localStorage.setItem(KEY, token); } catch { /* sans stockage, la session durera jusqu'au rechargement */ }
};
export const clearToken = () => {
  try { localStorage.removeItem(KEY); } catch { /* rien a faire */ }
};
