import { Link, Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import MyApplications from "./pages/MyApplications";
import RecruiterApplicants from "./pages/RecruiterApplicants";
import CreateJob from "./pages/CreateJob";

const features = [
  {
    icon: "⌕",
    title: "Discover opportunities",
    description:
      "Explore job listings and find roles that align with your skills, interests, and career goals.",
    color: "bg-blue-50 text-blue-700",
  },
  {
    icon: "▤",
    title: "Track applications",
    description:
      "Keep your applications organized and follow your progress from application to final decision.",
    color: "bg-indigo-50 text-indigo-700",
  },
  {
    icon: "↗",
    title: "Move forward",
    description:
      "Stay organized, manage your next steps, and make your job search more productive.",
    color: "bg-violet-50 text-violet-700",
  },
];

function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      {/* Navigation */}
      <header className="relative z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10"
        >
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="JobTrack home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-xl font-black text-white shadow-lg shadow-blue-600/20">
              J
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Job<span className="text-blue-700">Track</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/jobs"
              className="hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-700 sm:inline-flex"
            >
              Browse jobs
            </Link>

            {loading ? (
              <div
                className="h-10 w-28 animate-pulse rounded-xl bg-slate-100"
                aria-label="Loading account"
              />
            ) : user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-700/20 sm:px-5"
              >
                Dashboard <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-700/20 sm:px-5"
                >
                  Get started <span aria-hidden="true">→</span>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-28 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-36 -left-20 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Your career journey, simplified
            </div>

            <h1 className="mt-7 text-4xl font-black leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl xl:text-7xl">
              Your next opportunity
              <span className="mt-2 block bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 bg-clip-text pb-2 text-transparent">
                starts here.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Take control of your job search. Discover opportunities, manage
              applications, and track your progress — all from one organized
              workspace.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {loading ? (
                <div className="h-12 w-40 animate-pulse rounded-xl bg-slate-200" />
              ) : user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-3 rounded-xl bg-blue-700 px-7 py-3.5 font-bold text-white shadow-xl shadow-blue-700/20 transition hover:-translate-y-1 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-700/20"
                >
                  Open dashboard <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-3 rounded-xl bg-blue-700 px-7 py-3.5 font-bold text-white shadow-xl shadow-blue-700/20 transition hover:-translate-y-1 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-700/20"
                  >
                    Start your journey <span aria-hidden="true">→</span>
                  </Link>

                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-3.5 font-bold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-700/10"
                  >
                    Welcome back? Log in
                  </Link>
                </>
              )}
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <span className="font-bold text-emerald-600">✓</span>
                Organized job search
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="font-bold text-emerald-600">✓</span>
                Application tracking
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="font-bold text-emerald-600">✓</span>
                One workspace
              </span>
            </div>
          </div>

          {/* Decorative dashboard preview */}
          <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
            <div
              aria-hidden="true"
              className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-blue-200/50 via-indigo-100/40 to-violet-200/50 blur-2xl"
            />

            <div className="relative rounded-[2rem] border border-white bg-white/90 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                    Your workspace
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold text-slate-900">
                    Career overview
                  </h2>
                </div>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 sm:p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl text-blue-700">
                    ▤
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-500">
                    Applications
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-900">
                    Track
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Stay organized
                  </p>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 sm:p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-xl text-indigo-700">
                    ⌕
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-500">
                    Opportunities
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-900">
                    Explore
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Find your next role
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Keep moving forward
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Every step brings you closer to your next opportunity.
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xl text-emerald-600">
                    ↗
                  </div>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                </div>
                <p className="mt-2 text-right text-xs font-medium text-slate-500">
                  Your journey, your pace
                </p>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-950 p-4 text-white">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">
                  ✦
                </div>
                <div>
                  <p className="text-sm font-bold">One focused workspace</p>
                  <p className="mt-1 text-xs text-slate-300">
                    Search. Apply. Track. Grow.
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:flex">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-700">
                ✓
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Stay organized
                </p>
                <p className="text-xs text-slate-500">One step at a time</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
              Built for your next move
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Make your job search work for you.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Less confusion, more clarity. JobTrack helps you keep the
              important parts of your career search in one place.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 sm:p-7"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl font-bold ${feature.color}`}
                >
                  {feature.icon}
                </div>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  0{index + 1}
                </p>

                <h3 className="mt-2 text-xl font-extrabold text-slate-900 transition group-hover:text-blue-800">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 px-6 py-12 text-center shadow-xl shadow-indigo-900/15 sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-blue-300/20 blur-2xl"
          />

          <div className="relative mx-auto max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
              Your future is worth the effort
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Ready to take the next step?
            </h2>
            <p className="mt-4 leading-7 text-blue-100">
              Start organizing your job search today and move toward your
              career goals with more confidence.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/jobs"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-blue-800 transition hover:-translate-y-0.5 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                Explore jobs <span aria-hidden="true">→</span>
              </Link>

              {!loading && !user && (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold text-white transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20"
                >
                  Create your account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-sm font-black text-white">
              J
            </span>
            <span className="font-extrabold text-slate-900">
              Job<span className="text-blue-700">Track</span>
            </span>
          </Link>

          <p className="text-sm text-slate-500">
            Organize your search. Focus on your future.
          </p>

          <Link
            to="/jobs"
            className="text-sm font-semibold text-slate-600 transition hover:text-blue-700"
          >
            Browse jobs →
          </Link>
        </div>

        <div className="mx-auto mt-6 max-w-7xl border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} JobTrack. Built to support your career
          journey.
        </div>
      </footer>
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

      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/create" element={<CreateJob />} />
      <Route path="/jobs/:id" element={<JobDetails />} />
      <Route path="/my-applications" element={<MyApplications />} />
      <Route
        path="/recruiter/jobs/:jobId/applicants"
        element={<RecruiterApplicants />}
      />

      {/* Keep the fallback route last. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}