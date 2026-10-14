
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyApplications,
  withdrawApplication,
} from "../api/applicationApi";

const STATUS_STYLES = {
  applied: "bg-yellow-100 text-yellow-800",
  pending: "bg-yellow-100 text-yellow-800",
  shortlisted: "bg-blue-100 text-blue-800",
  interview: "bg-purple-100 text-purple-800",
  selected: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-700",
};

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusStyle(status) {
  return STATUS_STYLES[status] || "bg-gray-100 text-gray-700";
}

function getJob(application) {
  return application?.job &&
    typeof application.job === "object"
    ? application.job
    : null;
}

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getMyApplications();

      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setApplications(list);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your applications."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleWithdraw = async (applicationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to withdraw this application?"
    );

    if (!confirmed) return;

    setWithdrawingId(applicationId);
    setError("");
    setNotice("");

    try {
      await withdrawApplication(applicationId);

      setApplications((current) =>
        current.map((application) =>
          application._id === applicationId
            ? { ...application, status: "withdrawn" }
            : application
        )
      );

      setNotice("Your application has been withdrawn.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to withdraw your application."
      );
    } finally {
      setWithdrawingId(null);
    }
  };

  const filteredApplications =
    statusFilter === "all"
      ? applications
      : applications.filter(
          (application) => application.status === statusFilter
        );

  const statusOptions = [
    "all",
    ...new Set(applications.map((application) => application.status)),
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/dashboard"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              My Applications
            </h1>

            <p className="mt-2 text-gray-600">
              Track your submitted applications and their current status.
            </p>
          </div>

          <Link
            to="/jobs"
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            Browse Jobs
          </Link>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Total Applications</p>
            <p className="mt-2 text-3xl font-bold">
              {applications.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="mt-2 text-3xl font-bold">
              {
                applications.filter((application) =>
                  [
                    "applied",
                    "pending",
                    "shortlisted",
                    "interview",
                  ].includes(application.status)
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Selected</p>
            <p className="mt-2 text-3xl font-bold">
              {
                applications.filter(
                  (application) => application.status === "selected"
                ).length
              }
            </p>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Application History
            </h2>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              Filter:
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === "all" ? "All statuses" : formatStatus(status)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {notice && (
            <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {notice}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <p className="py-10 text-center text-gray-500">
              Loading applications...
            </p>
          ) : filteredApplications.length === 0 ? (
            <div className="py-10 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {applications.length === 0
                  ? "No applications yet"
                  : "No applications match this filter"}
              </h3>

              <p className="mt-2 text-gray-600">
                {applications.length === 0
                  ? "Browse available jobs and submit your first application."
                  : "Try selecting another application status."}
              </p>

              {applications.length === 0 && (
                <Link
                  to="/jobs"
                  className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
                >
                  Find Jobs
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => {
                const job = getJob(application);
                const canWithdraw = [
                  "applied",
                  "pending",
                  "shortlisted",
                  "interview",
                ].includes(application.status);

                return (
                  <article
                    key={application._id}
                    className="rounded-xl border border-gray-200 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {job?.title || "Job title unavailable"}
                        </h3>

                        <p className="mt-1 text-gray-600">
                          {job?.company || "Company unavailable"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                          {job?.location && (
                            <span>{job.location}</span>
                          )}

                          {job?.jobType && (
                            <span>{formatStatus(job.jobType)}</span>
                          )}

                          <span>
                            Applied:{" "}
                            {application.appliedAt
                              ? new Date(
                                  application.appliedAt
                                ).toLocaleDateString()
                              : "Date unavailable"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`w-fit shrink-0 rounded-full px-3 py-1 text-sm font-medium ${getStatusStyle(
                          application.status
                        )}`}
                      >
                        {formatStatus(application.status)}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3 border-t pt-4">
                      {job?._id && (
                        <Link
                          to={`/jobs/${job._id}`}
                          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                        >
                          View Job
                        </Link>
                      )}

                      {canWithdraw && (
                        <button
                          type="button"
                          disabled={withdrawingId === application._id}
                          onClick={() => handleWithdraw(application._id)}
                          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {withdrawingId === application._id
                            ? "Withdrawing..."
                            : "Withdraw Application"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
