
import { Link, Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="max-w-2xl text-center">
        <p className="font-semibold text-blue-700">
          JOBTRACK
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
          Your job search, organized.
        </h1>

        <p className="mt-5 text-lg text-slate-600">
          Manage your applications, track progress, and keep
          your job search organized in one place.
        </p>

        {!loading && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  Get started
                </Link>

                <Link
                  to="/login"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold hover:bg-slate-100"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
