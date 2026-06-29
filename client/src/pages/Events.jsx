import { useState } from "react";
import { CalendarPlus, Download, MapPin, Search, Users } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../services/api";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/auth";
import { Empty, Modal, PageHeader, Pager, Skeleton } from "../components/UI";
import "../styles/events.css";

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function Events() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [modal, setModal] = useState(false);
  const { data, loading, reload } = useApi(`/events?page=${page}&search=${encodeURIComponent(search)}&category=${category}`, [page, search, category]);

  const register = async (id) => {
    try {
      await api.post(`/events/${id}/register`);
      toast.success("You're on the list");
      reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not register");
    }
  };

  const downloadCertificate = async (event) => {
    try {
      const response = await api.get(`/events/${event.id}/certificate`, { responseType: "blob" });
      saveBlob(response.data, `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-certificate.pdf`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Certificate is not available yet");
    }
  };

  const exportParticipants = async (event) => {
    try {
      const response = await api.get(`/events/${event.id}/participants.csv`, { responseType: "blob" });
      saveBlob(response.data, `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-participants.csv`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not export participants");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Discover"
        title="Campus events"
        description="Find the talks, workshops, and moments worth showing up for."
        action={user.role !== "student" && (
          <button className="primary-button compact" onClick={() => setModal(true)}>
            <CalendarPlus size={18} />New event
          </button>
        )}
      />
      <div className="filterbar">
        <label>
          <Search />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search events"
          />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All categories</option>
          <option>Technology</option>
          <option>Culture</option>
          <option>Sports</option>
          <option>Career</option>
        </select>
      </div>
      {loading ? (
        <Skeleton count={6} />
      ) : data?.items.length ? (
        <>
          <div className="card-grid">
            {data.items.map((event) => (
              <EventCard
                event={event}
                key={event.id}
                role={user.role}
                onRegister={register}
                onCertificate={downloadCertificate}
                onExport={exportParticipants}
              />
            ))}
          </div>
          <Pager {...data.pagination} onChange={setPage} />
        </>
      ) : (
        <Empty />
      )}
      {modal && <EventForm onClose={() => setModal(false)} after={() => { setModal(false); reload(); }} />}
    </>
  );
}

function EventCard({ event, role, onRegister, onCertificate, onExport }) {
  const isRegistered = event.my_registration_status === "registered";
  const attended = Boolean(event.my_attended);

  return (
    <article className="event-card">
      <div
        className="event-image"
        style={{ backgroundImage: `url(${event.banner_url || "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80"})` }}
      >
        <span>{event.category}</span>
        <time>
          <strong>{format(new Date(event.starts_at), "dd")}</strong>
          {format(new Date(event.starts_at), "MMM")}
        </time>
      </div>
      <div className="card-body">
        <h2>{event.title}</h2>
        <p>{event.description}</p>
        <div className="meta">
          <span><MapPin />{event.venue}</span>
          <span><Users />{event.registered_count}/{event.max_capacity}</span>
        </div>
        {role === "student" ? (
          <div className="card-actions">
            <button className="secondary-button" disabled={isRegistered} onClick={() => onRegister(event.id)}>
              {isRegistered ? "Registered" : "Register now"}
            </button>
            {attended && (
              <button className="secondary-button subtle" onClick={() => onCertificate(event)}>
                <Download size={16} />Certificate
              </button>
            )}
          </div>
        ) : (
          <button className="secondary-button" onClick={() => onExport(event)}>
            <Download size={16} />Export participants
          </button>
        )}
      </div>
    </article>
  );
}

function EventForm({ onClose, after }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    venue: "",
    startsAt: "",
    registrationDeadline: "",
    category: "Technology",
    maxCapacity: 100,
  });
  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post("/events", { ...form, deadline: form.registrationDeadline });
      toast.success("Event created");
      after();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not create event");
    }
  };
  return (
    <Modal title="Create event" onClose={onClose}>
      <form className="stack-form" onSubmit={submit}>
        {["title", "description", "venue"].map((name) => (
          <label key={name}>
            {name}
            <input required value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />
          </label>
        ))}
        <div className="form-row">
          <label>
            Starts at
            <input type="datetime-local" required onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
          </label>
          <label>
            Deadline
            <input type="datetime-local" required onChange={(event) => setForm({ ...form, registrationDeadline: event.target.value })} />
          </label>
        </div>
        <div className="form-row">
          <label>
            Category
            <select onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <option>Technology</option>
              <option>Culture</option>
              <option>Sports</option>
              <option>Career</option>
            </select>
          </label>
          <label>
            Capacity
            <input type="number" min="1" value={form.maxCapacity} onChange={(event) => setForm({ ...form, maxCapacity: event.target.value })} />
          </label>
        </div>
        <button className="primary-button">Publish event</button>
      </form>
    </Modal>
  );
}
