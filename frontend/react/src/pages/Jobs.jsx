
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJobs } from "../api/jobApi";

const PAGE_SIZE = 6;

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit: PAGE_SIZE,
          ...(keyword.trim() && { keyword: keyword.trim() }),
          ...(location.trim() && { location: location.trim() }),
          ...(jobType && { jobType }),
        };

        const result = await getJobs(params);
        const payload = result.data;

        const jobList = Array.isArray(payload)
          ? payload
          : payload?.jobs;

        if (!Array.isArray(jobList)) {
          throw new Error(
            "Unexpected jobs API response. Check the backend response format."
          );
        }

        if (cancelled) return;

        setJobs(jobList);

        // Adapt these fields if your controller uses different names.
        const total = Number(
          payload?.total ??
          payload?.totalJobs ??
          payload?.totalResults ??
          jobList.length
        );

        const totalPages = Number(
          payload?.totalPages ??
          Math.max(1, Math.ceil(total / PAGE_SIZE))
        );

        setPagination({
          total,
          totalPages: Math.max(1, totalPages),
        });
      } catch (err) {
        if (cancelled) return;

        console.error("Fetch jobs error:", err);
        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to load jobs."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchJobs();

    return () => {
      cancelled = true;
    };
  }, [keyword, location, jobType, page]);

  const resetFilters = () => {
    setKeyword("");
    setLocation("");
    setJobType("");
    setPage(1);
  };

  const updateKeyword = (value) => {
    setKeyword(value);
    setPage(1);
  };

  const updateLocation = (value) => {
    setLocation(value);
    setPage(1);
  };

  const updateJobType = (value) => {
    setJobType(value);
    setPage(1);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Find Your Next Job
          </h1>
          <p className="mt-2 text-slate-600">
            Search opportunities that match your skills and interests.
          </p>
        </header>

        {/* Search and filters */}
        <section className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={keyword}
            onChange={(e) => updateKeyword(e.target.value)}
            placeholder="Job title or keyword"
            aria-label="Search by keyword"
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
          />

          <input
            value={location}
            onChange={(e) => updateLocation(e.target.value)}
            placeholder="City or location"
            aria-label="Filter by location"
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
          />

          <select
            value={jobType}
            onChange={(e) => updateJobType(e.target.value)}
            aria-label="Filter by job type"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
          >
            <option value="">All job types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
          </select>

          <button
            onClick={resetFilters}
            className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Clear filters
          </button>
        </section>

        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            Available Jobs
          </h2>
          {!loading && (
            <p className="text-sm text-slate-500">
              {pagination.total} job(s) found
            </p>
          )}
        </div>

        {loading ? (
          <p className="py-10 text-slate-600">Loading jobs...</p>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p role="alert" className="text-red-700">{error}</p>
            <button
              onClick={() => setPage((current) => current)}
              className="mt-3 font-semibold text-blue-700"
            >
              Retry
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <h3 className="text-xl font-semibold">No jobs found</h3>
            <p className="mt-2 text-slate-600">
              Try another keyword or clear your filters.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <article
                  key={job._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <h3 className="text-xl font-bold text-slate-900">
                    {job.title}
                  </h3>

                  <p className="mt-2 font-medium text-blue-700">
                    {job.company}
                  </p>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>📍 {job.location || "Location not specified"}</p>
                    <p>💼 {job.jobType || "Job type not specified"}</p>
                    <p>
                      💰 {job.salaryMin != null || job.salaryMax != null
                        ? `${job.salaryMin ?? "—"} – ${job.salaryMax ?? "—"}`
                        : "Salary not disclosed"}
                    </p>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm text-slate-600">
                    {job.description || "No description provided."}
                  </p>

                  <Link
                    to={`/jobs/${job._id}`}
                    className="mt-5 inline-block rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
                  >
                    View Details
                  </Link>
                </article>
              ))}
            </div>

            <nav
              aria-label="Job pages"
              className="mt-8 flex items-center justify-center gap-4"
            >
              <button
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-slate-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-slate-600">
                Page {page} of {pagination.totalPages}
              </span>

              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-slate-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          </>
        )}
      </div>
    </main>
  );
}
