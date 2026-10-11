
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const successMessage = location.state?.message;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <Link
          to="/"
          className="text-sm font-semibold text-blue-700"
        >
          ← JobTrack
        </Link>

        <h1 className="mt-5 text-3xl font-bold tracking-tight">
          Welcome back
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Log in to manage your job applications.
        </p>

        {successMessage && (
          <p
            role="status"
            className="mt-5 rounded-xl bg-green-50 p-3 text-sm text-green-700"
          >
            {successMessage}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >
          <input
            className={inputClass}
            type="email"
            placeholder="Email address"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <input
            className={inputClass}
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button
            disabled={loading}
            className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          New to JobTrack?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-700 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
