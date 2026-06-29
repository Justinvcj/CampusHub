import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/auth";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", department: "" });

  if (user) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await (isRegister ? register(form) : login(form));
      toast.success(isRegister ? "Welcome to CampusHub" : "Welcome back");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Please check your details");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-story">
        <div className="auth-overlay">
          <div>
            <div className="brand-mark"><GraduationCap /> CampusHub</div>
            <p className="built-credit hero-credit">Built by Justin</p>
          </div>
          <div>
            <span className="eyebrow">One campus. One place.</span>
            <h1>Everything campus,<br />finally connected.</h1>
            <p>Discover events, find your people, and stay close to the community shaping your college years.</p>
            <div className="story-stats">
              <span><strong>50+</strong> campus events</span>
              <span><strong>10</strong> student clubs</span>
              <span><strong>24/7</strong> connected</span>
            </div>
          </div>
        </div>
      </section>
      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div>
            <span className="eyebrow">{isRegister ? "Join the community" : "Welcome back"}</span>
            <h2>{isRegister ? "Create your account" : "Sign in to CampusHub"}</h2>
            <p>{isRegister ? "Your campus life starts here." : "Pick up where you left off."}</p>
          </div>
          {isRegister && (
            <label>
              Full name
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your full name" />
            </label>
          )}
          <label>
            College email
            <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@college.edu" />
          </label>
          <label>
            Password
            <div className="password-field">
              <input required minLength="8" type={show ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button>
            </div>
          </label>
          {isRegister && (
            <div className="form-row">
              <label>
                Role
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </label>
              <label>
                Department
                <input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} placeholder="Computer Science" />
              </label>
            </div>
          )}
          <button className="primary-button" disabled={busy}>
            {busy ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
            <ArrowRight size={18} />
          </button>
          <p className="auth-switch">
            {isRegister ? "Already a member?" : "New to CampusHub?"}{" "}
            <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
