import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/auth";
import AppLayout from "./layouts/AppLayout";
import "./App.css";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Events = lazy(() => import("./pages/Events"));
const Clubs = lazy(() => import("./pages/Clubs"));
const LostFound = lazy(() => import("./pages/LostFound"));
const Notifications = lazy(() => import("./pages/Notifications"));
const People = lazy(() => import("./pages/People"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loader"><span /></div>;
  return user ? <AppLayout /> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.role === "admin" ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="app-loader"><span /></div>}><Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route element={<Protected />}>
            <Route index element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/lost-found" element={<LostFound />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/people" element={<AdminRoute><People /></AdminRoute>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes></Suspense>
        <Toaster position="top-right" toastOptions={{ className: "toast" }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
