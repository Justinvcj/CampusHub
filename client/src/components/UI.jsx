import { SearchX } from "lucide-react";

export const PageHeader = ({ eyebrow, title, description, action }) => (
  <header className="page-header"><div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</header>
);
export const Skeleton = ({ count = 4 }) => <div className="card-grid">{Array.from({ length: count }, (_, i) => <div className="skeleton" key={i} />)}</div>;
export const Empty = ({ title = "Nothing here yet", text = "Try changing your search or filters." }) => (
  <div className="empty"><SearchX size={30} /><h3>{title}</h3><p>{text}</p></div>
);
export const Pager = ({ page, pages, onChange }) => pages > 1 && (
  <div className="pager"><button disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button><span>{page} of {pages}</span><button disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button></div>
);
export const Modal = ({ title, children, onClose }) => (
  <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" onMouseDown={(e) => e.stopPropagation()}><header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close">×</button></header>{children}</section></div>
);
