import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

export function useApi(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await api.get(url); setData(response.data.data); }
    catch (err) { setError(err.response?.data?.message || "Could not load data"); }
    finally { setLoading(false); }
  }, [url]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}
