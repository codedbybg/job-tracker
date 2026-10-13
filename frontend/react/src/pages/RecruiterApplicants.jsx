import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getApplicantsForJob,
  updateApplicationStatus,
} from "../api/applicationApi";

const statusStyles = {
  applied: "bg-blue-100 text-blue-700",
  shortlisted: "bg-purple-100 text-purple-700",
  interview: "bg-amber-100 text-amber-700",
  selected: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-700",
};

const nextStatuses = [
  "shortlisted",
  "interview",
  "selected",
  "rejected",
];

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

const RecruiterApplicants = () => {
  const { jobId } = useParams();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchApplicants = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getApplicantsForJob(jobId);

        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(
            response.message || "Invalid applicants API response."
          );
        }

        if (active) {
          setApplications(response.data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load applicants."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (jobId) {
      fetchApplicants();
    } else {
      setError("Job ID is missing from the URL.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [jobId]);

  const handleStatusUpdate = async (applicationId, status) => {
    const confirmed = window.confirm(
      `Are you sure you want to change this application's status to "${status}"?`
    );

    if (!confirmed) return;

    setUpdatingId(applicationId);
    setSuccessMessage("");
    setActionError("");

    try {
      const response = await updateApplicationStatus(
        applicationId,
        status
      );

      if (!response.success) {
        throw new Error(
          response.message || "Failed to update application status."
        );
      }

      setApplications((current) =>
        current.map((application) =>
          application._id === applicationId
            ? {
                ...application,
                status: response.data?.status || status,
              }
            : application
        )
      );

      setSuccessMessage(
        response.message || "Application status updated successfully."
      );
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update application status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Loading applicants...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
          Job Applicants
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

  const job = applications.find((application) => application.job)?.job;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      {/* Page heading */}
      <div className="mb-8">
        <Link
          to="/recruiter/dashboard"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          Job Applicants
        </h1>

        {job && (
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {job.title} · {job.company}
          </p>
        )}

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Total applicants: {applications.length}
        </p>
      </div>

      {/* Success and error messages */}
      {successMessage && (
        <div
          role="status"
          className="mb-4 rounded-lg bg-green-50 p-3 text-green-700"
        >
          {successMessage}
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
        <section className="rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            No applicants yet
          </h2>

          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Applicants will appear here when candidates apply for this job.
          </p>
        </section>
      ) : (
        <div className="grid gap-5">
          {applications.map((application) => {
            const candidate = application.candidate;
            const status = application.status || "applied";
            const isUpdating = updatingId === application._id;

            const canUpdateStatus = [
              "applied",
              "shortlisted",
              "interview",
            ].includes(status);

            return (
              <article
                key={application._id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6"
              >
                {/* Candidate details */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {candidate?.name || "Candidate unavailable"}
                    </h2>

                    <p className="mt-1 text-gray-600 dark:text-gray-300">
                      {candidate?.email || "Email not available"}
                    </p>

                    {candidate?.phone && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Phone: {candidate.phone}
                      </p>
                    )}

                    {candidate?.location && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Location: {candidate.location}
                      </p>
                    )}

                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-semibold">Applied:</span>{" "}
                      {formatDate(application.appliedAt)}
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

                {/* Resume */}
                {candidate?.resume && (
                  <div className="mt-4">
                    <a
                      href={candidate.resume}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      View Resume
                    </a>
                  </div>
                )}

                {/* Application status actions */}
                {canUpdateStatus && (
                  <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-700">
                    <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Update application status
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {nextStatuses
                        .filter((nextStatus) => nextStatus !== status)
                        .map((nextStatus) => (
                          <button
                            key={nextStatus}
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleStatusUpdate(
                                application._id,
                                nextStatus
                              )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium capitalize text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            {isUpdating
                              ? "Updating..."
                              : nextStatus === "interview"
                                ? "Invite to Interview"
                                : nextStatus}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {status === "withdrawn" && (
                  <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    The candidate has withdrawn this application.
                  </p>
                )}

                {["selected", "rejected"].includes(status) && (
                  <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    This application has a final status: {status}.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default RecruiterApplicants;