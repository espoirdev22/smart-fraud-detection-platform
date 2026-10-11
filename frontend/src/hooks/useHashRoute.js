import { useCallback, useEffect, useState } from "react";

const parse = () => {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  return { path: path || "/", params: Object.fromEntries(new URLSearchParams(query)) };
};

export default function useHashRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const navigate = useCallback((path, params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    window.location.hash = q ? `${path}?${q}` : path;
  }, []);
  return { ...route, navigate };
}
