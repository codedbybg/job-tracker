import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJobById } from "../api/jobApi";
import api from "../api/axios";

export default function JobDetails() {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyError, setApplyError] = useState("");

  const handleApply = async (e) => {
    e.preventDefault();

    setApplying(true);
    setApplyMessage("");
    setApplyError("");

    try {

        console.log("Job ID from URL:", id);
        console.log("Job ID type:", typeof id);
        console.log("Application API URL:", `/applications/${id}`);

      const response = await api.post(`/applications/${id}`, { coverLetter });

      if (response.data.success) {
        setApplyMessage(
          response.data.message || "Application submitted successfully!",
        );
        setCoverLetter("");
      } else {
        setApplyError(
          response.data.message || "Could not submit your application.",
        );
      }
    } catch (error) {
      setApplyError(
        error.response?.data?.message ||
          "Application failed. Please try again.",
      );
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getJobById(id);

        // Supports { data: job } or { data: { job: job } }
        const payload = response.data;
        const jobData = payload?._id ? payload : payload?.job;

        if (!jobData?._id) {
          throw new Error(
            "Unexpected job details response. Check your backend API.",
          );
        }

        setJob(jobData);
      } catch (err) {
        console.error("Fetch job details error:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load job details. The job may not exist.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchJob();
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-slate-600">Loading job details...</p>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-bold">Job details unavailable</h1>

        <p role="alert" className="mt-3 text-red-600">
          {error || "This job could not be found."}
        </p>

        <Link
          to="/jobs"
          className="mt-5 inline-block font-semibold text-blue-700"
        >
          ← Back to jobs
        </Link>
      </main>
    );
  }

  const salary =
    job.salaryMin != null || job.salaryMax != null
      ? `${job.salaryMin ?? "—"} – ${job.salaryMax ?? "—"}`
      : "Not disclosed";

  const skills = Array.isArray(job.skills) ? job.skills : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/jobs" className="font-medium text-blue-700 hover:underline">
          ← Back to jobs
        </Link>

        <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>

              <p className="mt-2 text-lg font-semibold text-blue-700">
                {job.company}
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium capitalize text-blue-700">
              {job.jobType || "Job"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Location</p>
              <p className="mt-1 font-medium">
                {job.location || "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Salary</p>
              <p className="mt-1 font-medium">{salary}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Minimum experience</p>
              <p className="mt-1 font-medium">
                {job.experienceMin != null
                  ? `${job.experienceMin} years`
                  : "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Status</p>
              <p className="mt-1 font-medium capitalize">
                {job.status || "Not specified"}
              </p>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-bold">Job Description</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
              {job.description || "No description available."}
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold">Required Skills</h2>

            {skills.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-slate-500">Skills not specified.</p>
            )}
          </section>

          {job.deadline && (
            <section className="mt-8">
              <h2 className="text-xl font-bold">Application Deadline</h2>
              <p className="mt-2 text-slate-600">
                {new Date(job.deadline).toLocaleDateString()}
              </p>
            </section>
          )}

          <div className="mt-9 border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-500">
              Ready to apply? Make sure you're logged in as a candidate.
            </p>

            <Link
              to="/login"
              className="mt-4 inline-block rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Log in to Apply
            </Link>
          </div>
        </article>
        <section className="mt-8 rounded-xl border border-gray-200 p-6 dark:border-gray-700">
          <h2 className="mb-4 text-2xl font-bold">Apply for this Job</h2>

          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label htmlFor="coverLetter" className="mb-2 block font-medium">
                Cover Letter
              </label>

              <textarea
                id="coverLetter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell the recruiter why you're a good fit..."
                rows={5}
                className="w-full rounded-lg border border-gray-300 bg-transparent p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {applyMessage && <p className="text-green-600">{applyMessage}</p>}

            {applyError && <p className="text-red-600">{applyError}</p>}

            <button
              type="submit"
              disabled={applying}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {applying ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
