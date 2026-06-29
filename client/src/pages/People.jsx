import { useState } from "react";
import { Search } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { Empty, PageHeader, Pager, Skeleton } from "../components/UI";
export default function People() {
  const [page, setPage] = useState(1); const [search, setSearch] = useState(""); const { data, loading } = useApi(`/users?page=${page}&search=${encodeURIComponent(search)}`, [page, search]);
  return <><PageHeader eyebrow="Administration" title="Campus people" description="Students, faculty, and administrators in one directory." /><div className="filterbar"><label><Search /><input placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} /></label></div>{loading ? <Skeleton /> : data?.items.length ? <><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Joined</th></tr></thead><tbody>{data.items.map((u) => <tr key={u.id}><td><strong>{u.name}</strong></td><td>{u.email}</td><td><span className="tag">{u.role}</span></td><td>{u.department || "—"}</td><td>{new Date(u.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div><Pager {...data.pagination} onChange={setPage} /></> : <Empty />}</>;
}
