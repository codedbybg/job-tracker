
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJobById } from "../api/jobApi";
import { applyForJob } from "../api/applicationApi";
import { useAuth } from "../context/AuthContext";

function formatLabel(value) {
  if (!value) return "Not specified";

  return String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatSalary(min, max) {
  if (min == null && max == null) {
    return "Not specified";
  }

  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(amount);

  if (min != null && max != null) {
    return `₹${formatAmount(min)} – ₹${formatAmount(max)}`;
  }

  if (min != null) {
    return `From ₹${formatAmount(min)}`;
  }

  return `Up to ₹${formatAmount(max)}`;
}

function formatDate(value) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not specified";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function JobDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyError, setApplyError] = useState("");
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const fetchJob = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getJobById(id);
      const jobData = response?.data;

      if (!jobData || typeof jobData !== "object") {
        throw new Error("Job details are unavailable.");
      }

      setJob(jobData);
    } catch (err) {
      setJob(null);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load job details."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleApply = async () => {
    if (!user) {
      setApplyError("Please log in to apply for this job.");
      return;
    }

    if (user.role !== "candidate") {
      setApplyError("Only candidate accounts can apply for jobs.");
      return;
    }

    setApplying(true);
    setApplyMessage("");
    setApplyError("");

    try {
      const response = await applyForJob(id);

      setApplyMessage(
        response?.message || "Your application was submitted successfully."
      );

      setAlreadyApplied(true);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to submit your application.";

      if (
        err.response?.status === 409 ||
        /already applied|duplicate application/i.test(message)
      ) {
        setAlreadyApplied(true);
        setApplyMessage("You have already applied for this job.");
      } else {
        setApplyError(message);
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-5xl rounded-xl border bg-white p-8 text-center text-gray-500">
          Loading job details...
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-xl border bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Job details unavailable
          </h1>

          <p className="mt-3 text-gray-600">
            {error || "This job could not be found."}
          </p>

          <Link
            to="/jobs"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            Back to Jobs
          </Link>
        </div>
      </main>
    );
  }

  const skills = Array.isArray(job.skills)
    ? job.skills
    : typeof job.skills === "string"
      ? job.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
      : [];

  const isExpired =
    job.deadline &&
    !Number.isNaN(new Date(job.deadline).getTime()) &&
    new Date(job.deadline).getTime() < new Date().setHours(0, 0, 0, 0);

  const canApply = user?.role === "candidate";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/jobs"
          className="inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Jobs
        </Link>

        <section className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b bg-gradient-to-r from-blue-50 to-white p-6 sm:p-9">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                    {formatLabel(job.jobType)}
                  </span>

                  {isExpired && (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                      Application Deadline Passed
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  {job.title}
                </h1>

                <p className="mt-3 text-lg font-medium text-gray-700">
                  {job.company}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  {job.location || "Location not specified"}
                </p>
              </div>

              <div className="shrink-0">
                {canApply ? (
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={applying || alreadyApplied || Boolean(isExpired)}
                    className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
                  >
                    {applying
                      ? "Submitting..."
                      : alreadyApplied
                        ? "Already Applied"
                        : isExpired
                          ? "Applications Closed"
                          : "Apply Now"}
                  </button>
                ) : !user ? (
                  <Link
                    to="/login"
                    className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white hover:bg-blue-700"
                  >
                    Log in to Apply
                  </Link>
                ) : (
                  <p className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">
                    Recruiter accounts cannot apply.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-b p-6 sm:grid-cols-3 sm:p-8">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Salary Range</p>
              <p className="mt-2 font-semibold text-gray-900">
                {formatSalary(job.salaryMin, job.salaryMax)}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Minimum Experience</p>
              <p className="mt-2 font-semibold text-gray-900">
                {job.experienceMin == null
                  ? "Not specified"
                  : `${job.experienceMin} ${
                      Number(job.experienceMin) === 1 ? "year" : "years"
                    }`}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Application Deadline</p>
              <p className="mt-2 font-semibold text-gray-900">
                {formatDate(job.deadline)}
              </p>
            </div>
          </div>

          <div className="space-y-8 p-6 sm:p-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                Job Description
              </h2>

              <p className="mt-3 whitespace-pre-line leading-7 text-gray-600">
                {job.description || "No description provided."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                Required Skills
              </h2>

              {skills.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-gray-500">
                  No specific skills listed.
                </p>
              )}
            </section>

            {job.createdAt && (
              <section className="border-t pt-5">
                <p className="text-sm text-gray-500">
                  Posted on {formatDate(job.createdAt)}
                </p>
              </section>
            )}

            {applyMessage && (
              <div
                role="status"
                className="rounded-lg bg-green-50 p-4 text-sm text-green-700"
              >
                {applyMessage}
                {alreadyApplied && (
                  <Link
                    to="/my-applications"
                    className="ml-2 font-semibold underline"
                  >
                    View Applications
                  </Link>
                )}
              </div>
            )}

            {applyError && (
              <div
                role="alert"
                className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
              >
                {applyError}
                {!user && (
                  <Link
                    to="/login"
                    className="ml-2 font-semibold underline"
                  >
                    Log in
                  </Link>
                )}
              </div>
            )}

            {canApply && !isExpired && !alreadyApplied && (
              <div className="border-t pt-6">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
                >
                  {applying ? "Submitting..." : "Apply for This Position"}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
