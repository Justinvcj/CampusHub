import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Bell, CalendarDays, LayoutDashboard, LogOut, Menu, Search, ShieldCheck, Users, X } from "lucide-react";
import { useAuth } from "../context/auth";
import GlobalSearch from "../components/GlobalSearch";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const links = [
    ["/", LayoutDashboard, "Dashboard"],
    ["/events", CalendarDays, "Events"],
    ["/clubs", Users, "Clubs"],
    ["/lost-found", Search, "Lost & Found"],
    ["/notifications", Bell, "Notifications"],
    ...(user.role === "admin" ? [["/people", ShieldCheck, "People"]] : []),
  ];

  return (
    <div className="app-shell">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div>CH</div>
          <span>Campus<strong>Hub</strong></span>
          <button onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button>
        </div>
        <nav>
          {links.map(([to, Icon, label]) => (
            <NavLink to={to} end={to === "/"} key={to} onClick={() => setOpen(false)}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <p className="built-credit">Built by Justin</p>
        <div className="sidebar-user">
          <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <strong>{user.name}</strong>
            <span>{user.role} - {user.department || "Campus"}</span>
          </div>
          <button onClick={logout} title="Sign out"><LogOut size={18} /></button>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button className="menu-button" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button>
          <GlobalSearch />
          <NavLink to="/notifications" className="notification-button"><Bell size={19} /></NavLink>
        </header>
        <main><Outlet /></main>
      </div>
      {open && <button className="nav-scrim" onClick={() => setOpen(false)} aria-label="Close navigation" />}
    </div>
  );
}
