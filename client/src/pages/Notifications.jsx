import { Bell, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../services/api";
import { useApi } from "../hooks/useApi";
import { Empty, PageHeader, Skeleton } from "../components/UI";
export default function Notifications() {
  const { data, loading, reload } = useApi("/notifications");
  return <><PageHeader eyebrow="Inbox" title="Notifications" description="Updates from across your campus life." />{loading ? <Skeleton /> : data?.length ? <section className="notification-list">{data.map((n) => <article className={n.read_at ? "" : "unread"} key={n.id}><div className="list-icon"><Bell /></div><div><h2>{n.title}</h2><p>{n.message}</p><span>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span></div>{!n.read_at && <button className="icon-button" title="Mark as read" onClick={async () => { await api.patch(`/notifications/${n.id}/read`); reload(); }}><Check /></button>}</article>)}</section> : <Empty title="You're all caught up" text="New updates will appear here." />}</>;
}
