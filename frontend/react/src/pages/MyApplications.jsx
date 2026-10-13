import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyApplications,
  withdrawApplication,
} from "../api/applicationApi";

const statusStyles = {
  applied: "bg-blue-100 text-blue-700",
  shortlisted: "bg-purple-100 text-purple-700",
  interview: "bg-amber-100 text-amber-700",
  selected: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-700",
};

const withdrawableStatuses = ["applied", "shortlisted", "interview"];

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatSalary = (min, max) => {
  if (min == null && max == null) return "Not specified";

  const formatAmount = (amount) =>
    `₹${Number(amount).toLocaleString("en-IN")}`;

  if (min != null && max != null) {
    return `${formatAmount(min)} - ${formatAmount(max)}`;
  }

  if (min != null) return `From ${formatAmount(min)}`;

  return `Up to ${formatAmount(max)}`;
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [withdrawingId, setWithdrawingId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getMyApplications();

        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(
            response.message || "Invalid applications API response."
          );
        }

        setApplications(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load your applications."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleWithdraw = async (applicationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to withdraw this application? This action cannot be undone."
    );

    if (!confirmed) return;

    setWithdrawingId(applicationId);
    setActionMessage("");
    setActionError("");

    try {
      const response = await withdrawApplication(applicationId);

      if (!response.success) {
        throw new Error(
          response.message || "Could not withdraw application."
        );
      }

      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application._id === applicationId
            ? {
                ...application,
                status: response.data?.status || "withdrawn",
              }
            : application
        )
      );

      setActionMessage(
        response.message || "Application withdrawn successfully."
      );
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.message ||
          "Failed to withdraw application."
      );
    } finally {
      setWithdrawingId(null);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Loading your applications...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
          My Applications
        </h1>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 font-semibold underline"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      {/* Page heading */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Applications
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Track the progress of your job applications.
          </p>
        </div>

        <div className="w-fit rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-950">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Total applications
          </p>

          <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
            {applications.length}
          </p>
        </div>
      </div>

      {/* Withdrawal success and error messages */}
      {actionMessage && (
        <div
          role="status"
          className="mb-4 rounded-lg bg-green-50 p-3 text-green-700"
        >
          {actionMessage}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 p-3 text-red-700"
        >
          {actionError}
        </div>
      )}

      {/* Empty state */}
      {applications.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            No applications yet
          </h2>

          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Explore available jobs and submit your first application.
          </p>

          <Link
            to="/jobs"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Browse Jobs
          </Link>
        </section>
      ) : (
        /* Applications list */
        <div className="grid gap-5">
          {applications.map((application) => {
            const job = application.job;
            const status = application.status || "applied";
            const isWithdrawing = withdrawingId === application._id;
            const canWithdraw = withdrawableStatuses.includes(status);

            return (
              <article
                key={application._id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900 sm:p-6"
              >
                {/* Job information and status */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {job?.title || "Job no longer available"}
                    </h2>

                    <p className="mt-1 font-medium text-gray-600 dark:text-gray-300">
                      {job?.company || "Company not available"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        📍 {job?.location || "Location not specified"}
                      </span>

                      {job?.jobType && (
                        <span>💼 {job.jobType}</span>
                      )}
                    </div>

                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-semibold">Salary:</span>{" "}
                      {formatSalary(job?.salaryMin, job?.salaryMax)}
                    </p>
                  </div>

                  <span
                    className={`w-fit shrink-0 rounded-full px-3 py-1 text-sm font-semibold capitalize ${
                      statusStyles[status] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                {/* Application dates */}
                <div className="mt-5 grid gap-3 border-t border-gray-100 pt-4 text-sm dark:border-gray-700 sm:grid-cols-2">
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-semibold">Applied:</span>{" "}
                    {formatDate(application.appliedAt)}
                  </p>

                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-semibold">Job deadline:</span>{" "}
                    {formatDate(job?.deadline)}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {job?._id && (
                    <Link
                      to={`/jobs/${job._id}`}
                      className="inline-block rounded-lg border border-blue-600 px-4 py-2 font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800"
                    >
                      View Job Details
                    </Link>
                  )}

                  {canWithdraw && (
                    <button
                      type="button"
                      onClick={() => handleWithdraw(application._id)}
                      disabled={isWithdrawing}
                      className="rounded-lg border border-red-500 px-4 py-2 font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isWithdrawing
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
    </main>
  );
};

export default MyApplications;