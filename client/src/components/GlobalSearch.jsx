import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import api from "../services/api";

export default function GlobalSearch() {
  const [term, setTerm] = useState(""); const [results, setResults] = useState(null);
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (term.trim().length < 2) return setResults(null);
      const { data } = await api.get("/search", { params: { q: term } });
      setResults(Object.values(data.data).flat());
    }, 350);
    return () => clearTimeout(timer);
  }, [term]);
  return <div className="global-search"><Search size={17} /><input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search campus..." aria-label="Global search" />
    {results && <div className="search-results">{results.length ? results.map((item) => <a key={`${item.type}-${item.id}`} href={item.type === "event" ? "/events" : item.type === "club" ? "/clubs" : "/lost-found"}><span>{item.label}</span><small>{item.type}</small></a>) : <p>No results</p>}</div>}
  </div>;
}
