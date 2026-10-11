
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(form);
      navigate("/login", {
        state: { message: "Registration successful. Please log in." },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <Link
          to="/"
          className="text-sm font-semibold text-blue-700"
        >
          ← JobTrack
        </Link>

        <h1 className="mt-5 text-3xl font-bold tracking-tight">
          Create your account
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Start tracking your job applications.
        </p>

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
            name="name"
            placeholder="Full name"
            autoComplete="name"
            minLength={2}
            maxLength={50}
            required
            value={form.name}
            onChange={handleChange}
          />

          <input
            className={inputClass}
            type="email"
            name="email"
            placeholder="Email address"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
          />

          <input
            className={inputClass}
            type="password"
            name="password"
            placeholder="Password (at least 8 characters)"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            value={form.password}
            onChange={handleChange}
          />

          <input
            className={inputClass}
            type="tel"
            name="phone"
            placeholder="Phone (optional)"
            autoComplete="tel"
            value={form.phone}
            onChange={handleChange}
          />

          <input
            className={inputClass}
            name="location"
            placeholder="Location (optional)"
            autoComplete="address-level2"
            value={form.location}
            onChange={handleChange}
          />

          <button
            disabled={loading}
            className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-700 hover:underline"
          >
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
