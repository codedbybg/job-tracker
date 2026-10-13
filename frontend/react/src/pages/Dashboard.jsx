
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyJobs } from "../api/jobApi";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState("");

  const isRecruiter = user?.role === "recruiter";
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isRecruiter && !isAdmin) return;

    let active = true;

    const fetchMyJobs = async () => {
      setLoadingJobs(true);
      setJobsError("");

      try {
        const response = await getMyJobs();

        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.message || "Failed to load your jobs.");
        }

        if (active) {
          setJobs(response.data);
        }
      } catch (error) {
        if (active) {
          setJobsError(
            error.response?.data?.message ||
              error.message ||
              "Unable to load your jobs."
          );
        }
      } finally {
        if (active) {
          setLoadingJobs(false);
        }
      }
    };

    fetchMyJobs();

    return () => {
      active = false;
    };
  }, [isRecruiter, isAdmin]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-blue-700"
          >
            JobTrack
          </Link>

          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            Log out
          </button>
        </header>

        {/* Welcome section */}
        <section className="mt-10 rounded-2xl bg-slate-900 p-7 text-white sm:p-10">
          <p className="text-sm capitalize text-slate-300">
            {user?.role || "User"} dashboard
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Welcome, {user?.name || "User"}!
          </h1>

          <p className="mt-3 text-slate-300">
            {isRecruiter
              ? "Manage your job listings and find the right candidates."
              : isAdmin
                ? "Review your account and access JobTrack tools."
                : "Discover opportunities and keep track of your applications."}
          </p>
        </section>

        {/* Account information */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">Account email</p>
            <p className="mt-2 break-all font-semibold text-slate-900">
              {user?.email || "Not available"}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">Account role</p>
            <p className="mt-2 font-semibold capitalize text-slate-900">
              {user?.role || "Not available"}
            </p>
          </article>
        </section>

        {/* Recruiter dashboard */}
        {isRecruiter && (
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Your job listings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage the jobs you have posted.
                </p>
              </div>

              <Link
                to="/jobs/create"
                className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
              >
                + Post a Job
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-500">Jobs posted</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loadingJobs ? "…" : jobs.length}
                </p>
              </article>
            </div>

            {loadingJobs && (
              <p className="mt-6 text-slate-500">Loading your jobs...</p>
            )}

            {jobsError && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
              >
                {jobsError}
              </div>
            )}

            {!loadingJobs && !jobsError && jobs.length === 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <h3 className="text-lg font-semibold text-slate-900">
                  No jobs posted yet
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Create your first job listing to start receiving applications.
                </p>
                <Link
                  to="/jobs/create"
                  className="mt-5 inline-block font-semibold text-blue-700 hover:underline"
                >
                  Create your first job
                </Link>
              </div>
            )}

            {!loadingJobs && !jobsError && jobs.length > 0 && (
              <div className="mt-6 grid gap-5">
                {jobs.map((job) => (
                  <article
                    key={job._id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {job.title}
                        </h3>

                        <p className="mt-1 text-slate-600">
                          {job.company || "Company not specified"}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          {job.location || "Location not specified"}
                          {job.jobType ? ` · ${job.jobType}` : ""}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium capitalize text-blue-700">
                        {job.status || "Posted"}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                      <Link
                        to={`/jobs/${job._id}`}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View Job
                      </Link>

                      <Link
                        to={`/recruiter/jobs/${job._id}/applicants`}
                        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                      >
                        View Applicants
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Candidate dashboard */}
        {user?.role === "candidate" && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Your job search
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Browse opportunities or review applications you have submitted.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/jobs"
                className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
              >
                Browse Jobs
              </Link>

              <Link
                to="/my-applications"
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
              >
                My Applications
              </Link>
            </div>
          </section>
        )}

        <p className="mt-8 text-sm text-slate-500">
          Keep your JobTrack account details up to date.
        </p>
      </div>
    </main>
  );
}
