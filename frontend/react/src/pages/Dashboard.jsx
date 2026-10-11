
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-blue-700"
          >
            JobTrack
          </Link>

          <button
            onClick={logout}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            Log out
          </button>
        </header>

        <section className="mt-10 rounded-2xl bg-slate-900 p-7 text-white sm:p-10">
          <p className="text-sm text-slate-300">
            Your dashboard
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Welcome, {user?.name || "User"}!
          </h1>

          <p className="mt-3 text-slate-300">
            Track your progress and manage your JobTrack account.
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Account email
            </p>
            <p className="mt-2 break-all font-semibold">
              {user?.email}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Account role
            </p>
            <p className="mt-2 font-semibold capitalize">
              {user?.role}
            </p>
          </article>
        </section>

        <p className="mt-6 text-sm text-slate-500">
          Next, we'll connect job search, applications, and recruiter
          management to their backend APIs.
        </p>
      </div>
    </main>
  );
}
