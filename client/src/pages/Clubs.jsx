import { useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/auth";
import { Empty, PageHeader, Pager, Skeleton } from "../components/UI";

export default function Clubs() {
  const { user } = useAuth(); const [page, setPage] = useState(1); const [search, setSearch] = useState("");
  const { data, loading, reload } = useApi(`/clubs?page=${page}&search=${encodeURIComponent(search)}`, [page, search]);
  const join = async (id) => { try { await api.post(`/clubs/${id}/join`); toast.success("Welcome to the club"); reload(); } catch (e) { toast.error(e.response?.data?.message || "Could not join"); } };
  return <><PageHeader eyebrow="Communities" title="Find your people" description="Clubs are where shared interests turn into lasting friendships." action={user.role !== "student" && <button className="primary-button compact"><Plus />New club</button>} /><div className="filterbar"><label><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clubs" /></label><select><option>Most popular</option><option>Newest</option></select></div>{loading ? <Skeleton count={6} /> : data?.items.length ? <><div className="card-grid">{data.items.map((club, index) => <article className="club-card" key={club.id}><div className={`club-logo tone-${index % 4}`}>{club.logo_url ? <img src={club.logo_url} alt="" /> : club.name.slice(0,2).toUpperCase()}</div><span className="tag">{club.department || "Campus-wide"}</span><h2>{club.name}</h2><p>{club.description}</p><div className="club-footer"><span><Users />{club.member_count} members</span>{user.role === "student" ? <button onClick={() => join(club.id)}>Join club</button> : <button>Manage</button>}</div></article>)}</div><Pager {...data.pagination} onChange={setPage} /></> : <Empty title="No clubs found" />}</>;
}
