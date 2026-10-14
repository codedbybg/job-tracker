
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyJobs } from "../api/jobApi";
import { getMyApplications } from "../api/applicationApi";

export default function Dashboard() {
  const { user, logout } = useAuth();

  // Recruiter dashboard state
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");

  // Candidate dashboard state
  const [applications, setApplications] = useState([]);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationError, setApplicationError] = useState("");

  const isCandidate = user?.role === "candidate";
  const isRecruiter = user?.role === "recruiter";
  const isAdmin = user?.role === "admin";
  const canManageJobs = isRecruiter || isAdmin;

  // Fetch jobs for recruiters and admins
  useEffect(() => {
    if (!canManageJobs) return;

    const fetchJobs = async () => {
      setJobsLoading(true);
      setJobsError("");

      try {
        const response = await getMyJobs();

        // Support both { data: [...] } and direct array responses.
        const jobList = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        setJobs(jobList);
      } catch (error) {
        setJobsError(
          error.response?.data?.message ||
            "Failed to load your posted jobs."
        );
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, [canManageJobs]);

  // Fetch applications for candidates
  useEffect(() => {
    if (!isCandidate) return;

    const fetchApplications = async () => {
      setApplicationLoading(true);
      setApplicationError("");

      try {
        const response = await getMyApplications();

        // Support both { data: [...] } and direct array responses.
        const applicationList = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        setApplications(applicationList);
      } catch (error) {
        setApplicationError(
          error.response?.data?.message ||
            "Failed to load your applications."
        );
      } finally {
        setApplicationLoading(false);
      }
    };

    fetchApplications();
  }, [isCandidate]);

  // Recruiter statistics
  const recruiterStats = jobs.reduce(
    (totals, job) => {
      const stats = job.applicantStats || {};

      totals.totalApplicants += stats.totalApplicants || 0;
      totals.shortlisted += stats.shortlisted || 0;
      totals.selected += stats.selected || 0;

      return totals;
    },
    {
      totalApplicants: 0,
      shortlisted: 0,
      selected: 0,
    }
  );

  // Candidate statistics
  const candidateStats = {
    total: applications.length,

    pending: applications.filter(
      (application) =>
        ["applied", "pending"].includes(application.status)
    ).length,

    shortlisted: applications.filter(
      (application) => application.status === "shortlisted"
    ).length,

    selected: applications.filter(
      (application) => application.status === "selected"
    ).length,
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "selected":
        return "bg-green-100 text-green-700";

      case "shortlisted":
        return "bg-blue-100 text-blue-700";

      case "interview":
        return "bg-purple-100 text-purple-700";

      case "rejected":
        return "bg-red-100 text-red-700";

      case "withdrawn":
        return "bg-gray-200 text-gray-700";

      case "pending":
      case "applied":
        return "bg-yellow-100 text-yellow-800";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="text-2xl font-bold text-blue-600"
          >
            JobTrack
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-600 sm:inline">
              {user?.email}
            </span>

            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Welcome section */}
        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-blue-600">
            {formatStatus(user?.role)}
          </p>

          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Welcome, {user?.name || "User"}!
          </h1>

          <p className="mt-3 text-gray-600">
            {isCandidate
              ? "Manage your job applications and find your next opportunity."
              : isRecruiter
                ? "Manage your job postings and track your candidates."
                : "Review your dashboard and manage your job activity."}
          </p>
        </section>

        {/* Account information */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Account Email</p>
            <p className="mt-2 break-all font-semibold text-gray-900">
              {user?.email || "Not available"}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Account Role</p>
            <p className="mt-2 font-semibold capitalize text-gray-900">
              {user?.role || "Not available"}
            </p>
          </div>
        </section>

        {/* ================================================== */}
        {/* RECRUITER AND ADMIN DASHBOARD                       */}
        {/* ================================================== */}

        {canManageJobs && (
          <div className="space-y-8">
            {/* Recruiter actions */}
            <section className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Hiring Dashboard
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  Review your job postings and applicant activity.
                </p>
              </div>

              <Link
                to="/jobs/create"
                className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                + Post a Job
              </Link>
            </section>

            {/* Recruiter summary cards */}
            <section>
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                Hiring Overview
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Jobs Posted</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {jobsLoading ? "—" : jobs.length}
                  </p>
                </div>

                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">
                    Total Applicants
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {jobsLoading
                      ? "—"
                      : recruiterStats.totalApplicants}
                  </p>
                </div>

                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Shortlisted</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {jobsLoading
                      ? "—"
                      : recruiterStats.shortlisted}
                  </p>
                </div>

                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Selected</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {jobsLoading
                      ? "—"
                      : recruiterStats.selected}
                  </p>
                </div>
              </div>
            </section>

            {/* Posted jobs */}
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  Your Posted Jobs
                </h3>

                <Link
                  to="/jobs"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Browse all jobs
                </Link>
              </div>

              {jobsLoading ? (
                <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
                  Loading your jobs...
                </div>
              ) : jobsError ? (
                <div className="rounded-xl border border-red-200 bg-white p-6">
                  <p className="text-red-600">{jobsError}</p>

                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-3 text-sm font-medium text-blue-600 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : jobs.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-white p-8 text-center">
                  <h4 className="text-lg font-semibold text-gray-900">
                    No jobs posted yet
                  </h4>

                  <p className="mt-2 text-gray-600">
                    Publish your first job to start receiving applications.
                  </p>

                  <Link
                    to="/jobs/create"
                    className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
                  >
                    Create Your First Job
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {jobs.map((job) => (
                    <article
                      key={job._id}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">
                            {job.title}
                          </h4>

                          <p className="mt-1 text-sm text-gray-600">
                            {job.company}
                          </p>
                        </div>

                        {job.jobType && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            {formatStatus(job.jobType)}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm text-gray-500">
                        <span className="mr-1">Location:</span>
                        {job.location || "Not specified"}
                      </p>

                      {/* Per-job applicant statistics */}
                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          {
                            label: "Applicants",
                            value:
                              job.applicantStats?.totalApplicants ?? 0,
                          },
                          {
                            label: "Shortlisted",
                            value: job.applicantStats?.shortlisted ?? 0,
                          },
                          {
                            label: "Interviews",
                            value: job.applicantStats?.interview ?? 0,
                          },
                          {
                            label: "Selected",
                            value: job.applicantStats?.selected ?? 0,
                          },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className="rounded-lg bg-gray-50 p-3"
                          >
                            <p className="text-xs text-gray-500">
                              {stat.label}
                            </p>

                            <p className="mt-1 text-xl font-bold text-gray-900">
                              {stat.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Job actions */}
                      <div className="mt-5 flex flex-wrap gap-3 border-t pt-4">
                        <Link
                          to={`/jobs/${job._id}`}
                          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                        >
                          View Job
                        </Link>

                        <Link
                          to={`/recruiter/jobs/${job._id}/applicants`}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          View Applicants
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ================================================== */}
        {/* CANDIDATE DASHBOARD                                 */}
        {/* ================================================== */}

        {isCandidate && (
          <div className="space-y-8">
            {/* Candidate actions */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                Your Job Search
              </h2>

              <p className="mt-1 text-gray-600">
                Discover opportunities and track your applications.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/jobs"
                  className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
                >
                  Browse Jobs
                </Link>

                <Link
                  to="/my-applications"
                  className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium hover:bg-gray-100"
                >
                  View All Applications
                </Link>
              </div>
            </section>

            {/* Candidate summary cards */}
            <section>
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                Application Overview
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Total Applications",
                    value: candidateStats.total,
                  },
                  {
                    label: "Pending Review",
                    value: candidateStats.pending,
                  },
                  {
                    label: "Shortlisted",
                    value: candidateStats.shortlisted,
                  },
                  {
                    label: "Selected",
                    value: candidateStats.selected,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border bg-white p-5 shadow-sm"
                  >
                    <p className="text-sm text-gray-500">
                      {stat.label}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {applicationLoading ? "—" : stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent applications */}
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  Recent Applications
                </h3>

                {applications.length > 0 && (
                  <Link
                    to="/my-applications"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    View all
                  </Link>
                )}
              </div>

              {applicationLoading ? (
                <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
                  Loading your applications...
                </div>
              ) : applicationError ? (
                <div className="rounded-xl border border-red-200 bg-white p-6">
                  <p className="text-red-600">{applicationError}</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-white p-8 text-center">
                  <h4 className="text-lg font-semibold text-gray-900">
                    You haven't applied for any jobs yet
                  </h4>

                  <p className="mt-2 text-gray-600">
                    Find a suitable opportunity and submit your first application.
                  </p>

                  <Link
                    to="/jobs"
                    className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
                  >
                    Explore Jobs
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.slice(0, 5).map((application) => {
                    const job =
                      application.job &&
                      typeof application.job === "object"
                        ? application.job
                        : null;

                    return (
                      <article
                        key={application._id}
                        className="flex flex-col justify-between gap-4 rounded-xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900">
                            {job?.title || "Job title unavailable"}
                          </h4>

                          <p className="mt-1 text-sm text-gray-600">
                            {job?.company || "Company unavailable"}
                          </p>

                          {job?.location && (
                            <p className="mt-1 text-sm text-gray-500">
                              {job.location}
                            </p>
                          )}

                          <p className="mt-2 text-xs text-gray-500">
                            Applied:{" "}
                            {application.appliedAt
                              ? new Date(
                                  application.appliedAt
                                ).toLocaleDateString()
                              : "Date unavailable"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusClasses(
                              application.status
                            )}`}
                          >
                            {formatStatus(application.status)}
                          </span>

                          {job?._id && (
                            <Link
                              to={`/jobs/${job._id}`}
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              View Job
                            </Link>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Unknown role fallback */}
        {!isCandidate && !canManageJobs && (
          <section className="rounded-xl border bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Dashboard unavailable
            </h2>

            <p className="mt-2 text-gray-600">
              Your account role could not be identified. Please log in again
              or contact the administrator.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
