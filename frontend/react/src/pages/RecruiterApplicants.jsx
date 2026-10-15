import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    getApplicantsForJob,
    updateApplicationStatus,
} from "../api/applicationApi";

const statusStyles = {
    applied: "border-blue-200 bg-blue-50 text-blue-700",
    shortlisted: "border-violet-200 bg-violet-50 text-violet-700",
    interview: "border-amber-200 bg-amber-50 text-amber-700",
    selected: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-rose-200 bg-rose-50 text-rose-700",
    withdrawn: "border-slate-200 bg-slate-100 text-slate-600",
};

const nextStatuses = ["shortlisted", "interview", "selected", "rejected"];

const formatStatus = (status) => {
    if (!status) return "Unknown";

    return String(status)
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "Not available";

    return parsedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const getErrorMessage = (error, fallback) =>
    error?.userMessage ||
    error?.response?.data?.message ||
    error?.message ||
    fallback;

function StatCard({ icon, label, value, tone = "blue" }) {
    const tones = {
        blue: "bg-blue-50 text-blue-700 ring-blue-100",
        violet: "bg-violet-50 text-violet-700 ring-violet-100",
        amber: "bg-amber-50 text-amber-700 ring-amber-100",
        emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    };

    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                        {value}
                    </p>
                </div>
                <div
                    aria-hidden="true"
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ring-1 ${tones[tone] || tones.blue}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl animate-pulse space-y-6">
                <div className="h-5 w-36 rounded bg-slate-200" />
                <div className="h-36 rounded-3xl bg-slate-200" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="h-28 rounded-2xl bg-slate-200" />
                    ))}
                </div>
                <div className="h-64 rounded-2xl bg-slate-200" />
            </div>
        </main>
    );
}

const RecruiterApplicants = () => {
    const { jobId } = useParams();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [actionError, setActionError] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchApplicants = useCallback(async () => {
        if (!jobId) {
            setError("Job ID is missing from the URL.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await getApplicantsForJob(jobId);
            const list = Array.isArray(response)
                ? response
                : Array.isArray(response?.data)
                    ? response.data
                    : null;

            if (!list) {
                throw new Error(
                    response?.message || "The server returned an unexpected applicants response."
                );
            }

            setApplications(list);
        } catch (err) {
            setError(getErrorMessage(err, "Failed to load applicants."));
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        fetchApplicants();
    }, [fetchApplicants]);

    const job = applications.find((application) => application.job)?.job;

    const stats = useMemo(() => {
        const count = (status) =>
            applications.filter(
                (application) =>
                    String(application.status || "applied").toLowerCase() === status
            ).length;

        return {
            total: applications.length,
            applied: count("applied"),
            shortlisted: count("shortlisted"),
            interview: count("interview"),
            selected: count("selected"),
            rejected: count("rejected"),
        };
    }, [applications]);

    const filteredApplications = useMemo(() => {
        if (statusFilter === "all") return applications;

        return applications.filter(
            (application) =>
                String(application.status || "applied").toLowerCase() === statusFilter
        );
    }, [applications, statusFilter]);

    const handleStatusUpdate = async (applicationId, status) => {
        const confirmed = window.confirm(
            `Are you sure you want to change this application's status to "${formatStatus(status)}"?`
        );

        if (!confirmed) return;

        setUpdatingId(applicationId);
        setSuccessMessage("");
        setActionError("");

        try {
            const response = await updateApplicationStatus(applicationId, status);

            if (response?.success === false) {
                throw new Error(
                    response.message || "Failed to update application status."
                );
            }

            setApplications((current) =>
                current.map((application) =>
                    application._id === applicationId
                        ? {
                              ...application,
                              status: response?.data?.status || status,
                          }
                        : application
                )
            );

            setSuccessMessage(
                response?.message || `Application status changed to ${formatStatus(status)}.`
            );
        } catch (err) {
            setActionError(
                getErrorMessage(err, "Failed to update application status.")
            );
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) return <LoadingState />;

    if (error) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    <Link
                        to="/dashboard"
                        className="text-sm font-semibold text-blue-700 transition hover:text-blue-900"
                    >
                        ← Back to dashboard
                    </Link>
                    <div className="mt-6 rounded-2xl border border-rose-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-xl text-rose-700">
                            !
                        </div>
                        <h1 className="mt-4 text-xl font-bold text-slate-900">
                            Could not load applicants
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
                        <button
                            type="button"
                            onClick={fetchApplicants}
                            className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f5f7fb] text-slate-800">
            <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
                {/* Breadcrumb and page actions */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-700"
                    >
                        <span aria-hidden="true">←</span> Back to dashboard
                    </Link>
                    <Link
                        to="/jobs"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                        Browse jobs <span aria-hidden="true">↗</span>
                    </Link>
                </div>

                {/* Hero heading */}
                <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 px-6 py-8 text-white shadow-xl shadow-blue-950/10 sm:px-9 sm:py-9">
                    <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
                    <div className="pointer-events-none absolute -right-1 top-4 h-40 w-40 rounded-full border border-white/10" />
                    <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Hiring workspace
                            </span>
                            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                                Job applicants
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80 sm:text-base">
                                Review candidate profiles, monitor application progress, and update hiring decisions from one place.
                            </p>
                            {job && (
                                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-blue-100">
                                    <span className="font-bold text-white">{job.title}</span>
                                    <span className="hidden text-blue-300 sm:inline">•</span>
                                    <span>{job.company}</span>
                                </div>
                            )}
                        </div>
                        <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
                            <p className="text-xs font-semibold uppercase tracking-wider text-blue-100/80">
                                Total applicants
                            </p>
                            <p className="mt-1 text-3xl font-extrabold">{applications.length}</p>
                        </div>
                    </div>
                </section>

                {/* Status overview */}
                <section className="mb-9">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Application overview</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            A quick summary of where candidates are in your hiring process.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard icon="▤" label="Applied" value={stats.applied} tone="blue" />
                        <StatCard icon="↗" label="Shortlisted" value={stats.shortlisted} tone="violet" />
                        <StatCard icon="◷" label="Interview" value={stats.interview} tone="amber" />
                        <StatCard icon="✓" label="Selected" value={stats.selected} tone="emerald" />
                    </div>
                </section>

                {/* Feedback messages */}
                {successMessage && (
                    <div
                        role="status"
                        className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                    >
                        <span className="mt-0.5 font-bold" aria-hidden="true">✓</span>
                        <p className="font-medium">{successMessage}</p>
                        <button
                            type="button"
                            onClick={() => setSuccessMessage("")}
                            aria-label="Dismiss success message"
                            className="ml-auto rounded-lg px-2 font-bold text-emerald-800 hover:bg-emerald-100"
                        >
                            ×
                        </button>
                    </div>
                )}

                {actionError && (
                    <div
                        role="alert"
                        className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
                    >
                        <span className="mt-0.5 font-bold" aria-hidden="true">!</span>
                        <p>{actionError}</p>
                        <button
                            type="button"
                            onClick={() => setActionError("")}
                            aria-label="Dismiss error message"
                            className="ml-auto rounded-lg px-2 font-bold text-rose-800 hover:bg-rose-100"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Applicants list */}
                <section>
                    <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                Candidate applications
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {filteredApplications.length} of {applications.length} candidates shown
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <label
                                htmlFor="status-filter"
                                className="text-sm font-semibold text-slate-600"
                            >
                                Filter by status
                            </label>
                            <select
                                id="status-filter"
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                className="min-w-44 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            >
                                <option value="all">All statuses</option>
                                <option value="applied">Applied</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="interview">Interview</option>
                                <option value="selected">Selected</option>
                                <option value="rejected">Rejected</option>
                                <option value="withdrawn">Withdrawn</option>
                            </select>
                        </div>
                    </div>

                    {applications.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-700">
                                ♧
                            </div>
                            <h3 className="mt-4 text-lg font-bold text-slate-900">
                                No applicants yet
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                Applications will appear here when candidates apply for this job.
                            </p>
                        </div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                            <h3 className="text-lg font-bold text-slate-900">
                                No matching applications
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                Try selecting another status to see more candidates.
                            </p>
                            <button
                                type="button"
                                onClick={() => setStatusFilter("all")}
                                className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                                Clear filter
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredApplications.map((application, index) => {
                                const candidate = application.candidate;
                                const status = String(application.status || "applied").toLowerCase();
                                const isUpdating = updatingId === application._id;
                                const canUpdateStatus = ["applied", "shortlisted", "interview"].includes(status);
                                const candidateName = candidate?.name || "Candidate unavailable";
                                const initials = candidateName
                                    .split(/\s+/)
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((part) => part.charAt(0))
                                    .join("")
                                    .toUpperCase();

                                return (
                                    <article
                                        key={application._id}
                                        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-200 hover:border-blue-200 hover:shadow-md"
                                    >
                                        <div className="p-5 sm:p-6">
                                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="flex min-w-0 items-start gap-4">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-extrabold text-blue-800 ring-1 ring-blue-100">
                                                        {initials || "C"}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="text-lg font-bold text-slate-900">
                                                                {candidateName}
                                                            </h3>
                                                            <span className="text-xs text-slate-400">
                                                                Applicant #{index + 1}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 break-all text-sm text-slate-600">
                                                            {candidate?.email || "Email not available"}
                                                        </p>
                                                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                                                            {candidate?.phone && (
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <span aria-hidden="true">☎</span>
                                                                    {candidate.phone}
                                                                </span>
                                                            )}
                                                            {candidate?.location && (
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <span aria-hidden="true">⌖</span>
                                                                    {candidate.location}
                                                                </span>
                                                            )}
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <span aria-hidden="true">▦</span>
                                                                Applied {formatDate(application.appliedAt || application.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${statusStyles[status] || "border-slate-200 bg-slate-50 text-slate-600"}`}
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                        {formatStatus(status)}
                                                    </span>
                                                    {candidate?.resume && (
                                                        <a
                                                            href={candidate.resume}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                        >
                                                            View resume ↗
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {canUpdateStatus && (
                                                <div className="mt-6 border-t border-slate-100 pt-5">
                                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                                        <p className="text-sm font-bold text-slate-800">
                                                            Update candidate status
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            Choose the next hiring action
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {nextStatuses
                                                            .filter((nextStatus) => nextStatus !== status)
                                                            .map((nextStatus) => (
                                                                <button
                                                                    key={nextStatus}
                                                                    type="button"
                                                                    disabled={isUpdating || updatingId !== null}
                                                                    onClick={() => handleStatusUpdate(application._id, nextStatus)}
                                                                    className={`rounded-xl border px-3.5 py-2.5 text-sm font-bold capitalize transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                                                                        nextStatus === "selected"
                                                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-100"
                                                                            : nextStatus === "rejected"
                                                                                ? "border-rose-200 bg-white text-rose-700 hover:bg-rose-50 focus:ring-rose-100"
                                                                                : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:ring-blue-100"
                                                                    }`}
                                                                >
                                                                    {isUpdating
                                                                        ? "Updating..."
                                                                        : nextStatus === "interview"
                                                                            ? "Invite to interview"
                                                                            : nextStatus}
                                                                </button>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}

                                            {status === "withdrawn" && (
                                                <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-500">
                                                    The candidate has withdrawn this application.
                                                </p>
                                            )}

                                            {["selected", "rejected"].includes(status) && (
                                                <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-500">
                                                    This application has a final status: <span className="font-semibold">{formatStatus(status)}</span>.
                                                </p>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
                    JobTrack · Hiring made clearer.
                </footer>
            </div>
        </main>
    );
};

export default RecruiterApplicants;
