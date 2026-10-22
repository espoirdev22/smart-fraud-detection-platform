// Qui voit quoi. Le serveur applique les mêmes règles : ici on cache seulement les pages inutiles,
// la vraie protection est côté API (réponse 403).
export const ROLE_ANALYST = "Analyste Fraude";
export const ROLE_SUPERVISOR = "Superviseur";
export const ROLE_ADMIN = "Administrateur";

export const isSupervisor = (role) => role === ROLE_SUPERVISOR || role === ROLE_ADMIN;
export const isAdmin = (role) => role === ROLE_ADMIN;

const SUPERVISOR_PAGES = ["/reports", "/settings", "/users"];

export const canSee = (role, path) => !SUPERVISOR_PAGES.includes(path) || isSupervisor(role);
