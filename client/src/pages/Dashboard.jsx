import { CalendarCheck, CircleHelp, Compass, TicketCheck, Users } from "lucide-react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from "chart.js";
import { format } from "date-fns";
import { useAuth } from "../context/auth";
import { useApi } from "../hooks/useApi";
import { PageHeader, Skeleton } from "../components/UI";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function Dashboard() {
  const { user } = useAuth(); const { data, loading, error } = useApi(`/dashboard/${user.role}`);
  if (loading) return <><PageHeader eyebrow="Campus overview" title={`Good day, ${user.name.split(" ")[0]}`} description="Here's what's happening around you." /><Skeleton /></>;
  if (error) return <div className="empty"><CircleHelp /><h3>{error}</h3><p>Make sure the API and MySQL database are running.</p></div>;
  if (user.role === "faculty") return <Faculty data={data} user={user} />;
  const stats = user.role === "admin"
    ? [[Users, data.stats.students, "Students"], [Users, data.stats.faculty, "Faculty"], [CalendarCheck, data.stats.events, "Events"], [Compass, data.stats.clubs, "Clubs"]]
    : [[TicketCheck, data.stats.registered, "Registered events"], [Users, data.stats.clubs, "Joined clubs"], [Compass, data.stats.reports, "Item reports"], [CircleHelp, data.stats.claims, "Pending claims"]];
  const chartRows = data.charts?.registrations || [{ label: "Jan", value: 12 }, { label: "Feb", value: 19 }, { label: "Mar", value: 17 }, { label: "Apr", value: 28 }, { label: "May", value: 34 }];
  const chart = { labels: chartRows.map((r) => r.label), datasets: [{ data: chartRows.map((r) => r.value), borderColor: "#79e5c5", backgroundColor: "rgba(121,229,197,.12)", tension: .4, fill: true }] };
  return <><PageHeader eyebrow={`${user.role} dashboard`} title={`Good day, ${user.name.split(" ")[0]}`} description="A clear view of your campus, all in one place." />
    <div className="stat-grid">{stats.map(([Icon, value, label]) => <article className="stat-card" key={label}><div><span>{label}</span><strong>{value}</strong></div><Icon /></article>)}</div>
    <div className="dashboard-grid"><section className="panel chart-panel"><header><div><span className="eyebrow">Last six months</span><h2>Campus momentum</h2></div></header><Line data={chart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: "#788398" } }, y: { grid: { color: "rgba(255,255,255,.06)" }, ticks: { color: "#788398" } } } }} /></section>
      <section className="panel"><header><div><span className="eyebrow">At a glance</span><h2>{user.role === "admin" ? "Recent registrations" : "Upcoming events"}</h2></div></header><div className="list">{(data.recentUsers || data.upcoming || []).map((item) => <div className="list-item" key={item.id}><div className="list-icon">{(item.name || item.title).slice(0, 1)}</div><div><strong>{item.name || item.title}</strong><span>{item.email || `${item.venue} · ${format(new Date(item.starts_at), "MMM d")}`}</span></div></div>)}</div></section>
    </div></>;
}
function Faculty({ data, user }) {
  return <><PageHeader eyebrow="Faculty dashboard" title={`Good day, ${user.name.split(" ")[0]}`} description="Manage the communities and events in your care." /><div className="stat-grid"><article className="stat-card"><div><span>Managed clubs</span><strong>{data.clubs.length}</strong></div><Users /></article><article className="stat-card"><div><span>Managed events</span><strong>{data.events.length}</strong></div><CalendarCheck /></article></div><div className="dashboard-grid"><section className="panel"><header><h2>Your events</h2></header><div className="list">{data.events.map((e) => <div className="list-item" key={e.id}><div className="list-icon">{e.title[0]}</div><div><strong>{e.title}</strong><span>{format(new Date(e.starts_at), "MMM d, yyyy")} · {e.status}</span></div></div>)}</div></section><section className="panel"><header><h2>Recent announcements</h2></header><div className="list">{data.announcements.map((a, i) => <div className="list-item" key={i}><div><strong>{a.title}</strong><span>{a.club_name}</span></div></div>)}</div></section></div></>;
}
