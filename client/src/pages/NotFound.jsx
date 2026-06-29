import { Link } from "react-router-dom";
export default function NotFound() { return <main className="not-found"><span>404</span><h1>This corner of campus is empty.</h1><p>The page may have moved, or the address needs another look.</p><Link className="primary-button" to="/">Back to dashboard</Link></main>; }
