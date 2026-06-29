import { useState } from "react";
import { MapPin, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../services/api";
import { useApi } from "../hooks/useApi";
import { Empty, Modal, PageHeader, Pager, Skeleton } from "../components/UI";

export default function LostFound() {
  const [page, setPage] = useState(1); const [search, setSearch] = useState(""); const [type, setType] = useState(""); const [modal, setModal] = useState(false);
  const { data, loading, reload } = useApi(`/lost-items?page=${page}&search=${encodeURIComponent(search)}&item_type=${type}`, [page, search, type]);
  return <><PageHeader eyebrow="Community help" title="Lost & found" description="A simple way to help things make their way home." action={<button className="primary-button compact" onClick={() => setModal(true)}><Plus />Report item</button>} /><div className="filterbar"><label><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items or locations" /></label><select value={type} onChange={(e) => setType(e.target.value)}><option value="">Lost and found</option><option value="lost">Lost</option><option value="found">Found</option></select></div>{loading ? <Skeleton /> : data?.items.length ? <><div className="card-grid">{data.items.map((item) => <article className="item-card" key={item.id}>{item.image_url && <img src={item.image_url} alt="" />}<div className="card-body"><div className="card-kicker"><span className={`status ${item.item_type}`}>{item.item_type}</span><time>{format(new Date(item.item_date), "MMM d")}</time></div><h2>{item.title}</h2><p>{item.description}</p><div className="meta"><span><MapPin />{item.location}</span></div><button className="secondary-button" onClick={async () => { const proof = prompt("Describe identifying details (at least 10 characters)"); if (proof) { try { await api.post(`/lost-items/${item.id}/claim`, { proof }); toast.success("Claim submitted"); } catch (e) { toast.error(e.response?.data?.message); } } }}>This is mine</button></div></article>)}</div><Pager {...data.pagination} onChange={setPage} /></> : <Empty title="No matching items" />}{modal && <ReportForm onClose={() => setModal(false)} after={() => { setModal(false); reload(); }} />}</>;
}
function ReportForm({ onClose, after }) {
  const [form, setForm] = useState({ title: "", description: "", category: "", location: "", itemDate: "", itemType: "lost" });
  const submit = async (e) => { e.preventDefault(); try { await api.post("/lost-items", form); toast.success("Report published"); after(); } catch (err) { toast.error(err.response?.data?.message || "Could not publish"); } };
  return <Modal title="Report an item" onClose={onClose}><form className="stack-form" onSubmit={submit}>{["title","description","category","location"].map((name) => <label key={name}>{name}<input required value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} /></label>)}<div className="form-row"><label>Date<input required type="date" onChange={(e) => setForm({ ...form, itemDate: e.target.value })} /></label><label>Type<select onChange={(e) => setForm({ ...form, itemType: e.target.value })}><option value="lost">Lost</option><option value="found">Found</option></select></label></div><button className="primary-button">Publish report</button></form></Modal>;
}
