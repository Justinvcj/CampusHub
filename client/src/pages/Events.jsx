import { useState } from "react";
import { CalendarPlus, MapPin, Search, Users } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../services/api";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/auth";
import { Empty, Modal, PageHeader, Pager, Skeleton } from "../components/UI";

export default function Events() {
  const { user } = useAuth(); const [page, setPage] = useState(1); const [search, setSearch] = useState(""); const [category, setCategory] = useState(""); const [modal, setModal] = useState(false);
  const { data, loading, reload } = useApi(`/events?page=${page}&search=${encodeURIComponent(search)}&category=${category}`, [page, search, category]);
  const register = async (id) => { try { await api.post(`/events/${id}/register`); toast.success("You're on the list"); reload(); } catch (e) { toast.error(e.response?.data?.message || "Could not register"); } };
  return <><PageHeader eyebrow="Discover" title="Campus events" description="Find the talks, workshops, and moments worth showing up for." action={user.role !== "student" && <button className="primary-button compact" onClick={() => setModal(true)}><CalendarPlus size={18} />New event</button>} />
    <div className="filterbar"><label><Search /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search events" /></label><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option><option>Technology</option><option>Culture</option><option>Sports</option><option>Career</option></select></div>
    {loading ? <Skeleton count={6} /> : data?.items.length ? <><div className="card-grid">{data.items.map((event) => <article className="event-card" key={event.id}><div className="event-image" style={{ backgroundImage: `url(${event.banner_url || `https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80`})` }}><span>{event.category}</span><time><strong>{format(new Date(event.starts_at), "dd")}</strong>{format(new Date(event.starts_at), "MMM")}</time></div><div className="card-body"><h2>{event.title}</h2><p>{event.description}</p><div className="meta"><span><MapPin />{event.venue}</span><span><Users />{event.registered_count}/{event.max_capacity}</span></div>{user.role === "student" ? <button className="secondary-button" onClick={() => register(event.id)}>Register now</button> : <button className="secondary-button">Manage event</button>}</div></article>)}</div><Pager {...data.pagination} onChange={setPage} /></> : <Empty />}
    {modal && <EventForm onClose={() => setModal(false)} after={() => { setModal(false); reload(); }} />}
  </>;
}
function EventForm({ onClose, after }) {
  const [form, setForm] = useState({ title: "", description: "", venue: "", startsAt: "", registrationDeadline: "", category: "Technology", maxCapacity: 100 });
  const submit = async (e) => { e.preventDefault(); try { await api.post("/events", { ...form, deadline: form.registrationDeadline }); toast.success("Event created"); after(); } catch (err) { toast.error(err.response?.data?.message || "Could not create event"); } };
  return <Modal title="Create event" onClose={onClose}><form className="stack-form" onSubmit={submit}>{["title","description","venue"].map((name) => <label key={name}>{name}<input required value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} /></label>)}<div className="form-row"><label>Starts at<input type="datetime-local" required onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></label><label>Deadline<input type="datetime-local" required onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} /></label></div><div className="form-row"><label>Category<select onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Technology</option><option>Culture</option><option>Sports</option><option>Career</option></select></label><label>Capacity<input type="number" min="1" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })} /></label></div><button className="primary-button">Publish event</button></form></Modal>;
}
