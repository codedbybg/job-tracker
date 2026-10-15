import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    getMyApplications,
    withdrawApplication,
} from "../api/applicationApi";

const APPLICATION_STATUSES = [
    "applied",
    "shortlisted",
    "interview",
    "selected",
    "rejected",
    "withdrawn",
];

const STATUS_STYLES = {
    applied: "bg-amber-50 text-amber-700 ring-amber-200",
    shortlisted: "bg-blue-50 text-blue-700 ring-blue-200",
    interview: "bg-violet-50 text-violet-700 ring-violet-200",
    selected: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rejected: "bg-red-50 text-red-700 ring-red-200",
    withdrawn: "bg-slate-100 text-slate-600 ring-slate-200",
};

const STATUS_ICONS = {
    applied: "◷",
    shortlisted: "✓",
    interview: "▣",
    selected: "★",
    rejected: "×",
    withdrawn: "↩",
};

function formatLabel(value) {
    if (!value) return "Not specified";

    return String(value)
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatStatus(status) {
    return formatLabel(status || "unknown");
}

function getStatusStyle(status) {
    return (
        STATUS_STYLES[status] ||
        "bg-gray-100 text-gray-700 ring-gray-200"
    );
}

function getJob(application) {
    return application?.job && typeof application.job === "object"
        ? application.job
        : null;
}

function getErrorMessage(error, fallback) {
    return (
        error?.userMessage ||
        error?.response?.data?.message ||
        error?.message ||
        fallback
    );
}

function formatDate(dateValue) {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function getApplicationList(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.applications)) {
        return response.applications;
    }

    return null;
}

function SummaryCard({ label, value, description, icon, iconStyle }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {label}
                    </p>

                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                        {description}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${iconStyle}`}
                    aria-hidden="true"
                >
                    {icon}
                </div>
            </div>
        </article>
    );
}

function ApplicationSkeleton() {
    return (
        <div
            className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
            aria-hidden="true"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="h-5 w-2/3 rounded bg-slate-200" />
                    <div className="mt-3 h-4 w-1/3 rounded bg-slate-100" />
                    <div className="mt-5 h-3 w-1/2 rounded bg-slate-100" />
                </div>
                <div className="h-7 w-24 rounded-full bg-slate-100" />
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4">
                <div className="h-9 w-32 rounded-lg bg-slate-100" />
            </div>
        </div>
    );
}

export default function MyApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [error, setError] = useState("");
    const [withdrawingId, setWithdrawingId] = useState(null);
    const [notice, setNotice] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        setLoadFailed(false);
        setError("");
        setNotice("");

        try {
            const response = await getMyApplications();
            const list = getApplicationList(response);

            if (!list) {
                throw new Error(
                    "The server returned an unexpected applications response."
                );
            }

            setApplications(list);
        } catch (err) {
            setLoadFailed(true);
            setError(
                getErrorMessage(
                    err,
                    "Unable to load your applications."
                )
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleWithdraw = async (applicationId) => {
        if (withdrawingId !== null) return;

        const confirmed = window.confirm(
            "Are you sure you want to withdraw this application? This action may not be reversible."
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

            setNotice(
                "Your application has been withdrawn successfully."
            );
        } catch (err) {
            setError(
                getErrorMessage(
                    err,
                    "Failed to withdraw your application."
                )
            );
        } finally {
            setWithdrawingId(null);
        }
    };

    const stats = useMemo(() => {
        const countStatus = (statuses) =>
            applications.filter((application) =>
                statuses.includes(application.status)
            ).length;

        return {
            total: applications.length,
            inProgress: countStatus([
                "applied",
                "shortlisted",
                "interview",
            ]),
            selected: countStatus(["selected"]),
            interviews: countStatus(["interview"]),
        };
    }, [applications]);

    const filteredApplications = useMemo(() => {
        const filtered =
            statusFilter === "all"
                ? applications
                : applications.filter(
                      (application) =>
                          application.status === statusFilter
                  );

        // Newest applications appear first.
        return [...filtered].sort((a, b) => {
            const dateA = new Date(
                a.appliedAt || a.createdAt || 0
            ).getTime();

            const dateB = new Date(
                b.appliedAt || b.createdAt || 0
            ).getTime();

            return dateB - dateA;
        });
    }, [applications, statusFilter]);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                {/* Page header */}
                <header className="mb-8">
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                    >
                        <span aria-hidden="true">←</span>
                        Back to Dashboard
                    </Link>

                    <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                                Candidate workspace
                            </p>

                            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                My Applications
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                Keep track of your job applications,
                                follow your progress, and stay informed
                                about your hiring journey.
                            </p>
                        </div>

                        <Link
                            to="/jobs"
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
                        >
                            <span aria-hidden="true">＋</span>
                            Explore Jobs
                        </Link>
                    </div>
                </header>

                {/* Summary cards */}
                <section
                    aria-label="Application statistics"
                    className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <SummaryCard
                        label="Total Applications"
                        value={stats.total}
                        description="Applications submitted"
                        icon="▤"
                        iconStyle="bg-blue-50 text-blue-600"
                    />

                    <SummaryCard
                        label="In Progress"
                        value={stats.inProgress}
                        description="Awaiting a final outcome"
                        icon="◷"
                        iconStyle="bg-amber-50 text-amber-600"
                    />

                    <SummaryCard
                        label="Interviews"
                        value={stats.interviews}
                        description="Interview-stage applications"
                        icon="▣"
                        iconStyle="bg-violet-50 text-violet-600"
                    />

                    <SummaryCard
                        label="Selected"
                        value={stats.selected}
                        description="Successful outcomes"
                        icon="★"
                        iconStyle="bg-emerald-50 text-emerald-600"
                    />
                </section>

                {/* Applications panel */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 p-5 sm:p-6">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    Application History
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {loading
                                        ? "Loading your application history..."
                                        : `${filteredApplications.length} ${
                                              filteredApplications.length === 1
                                                  ? "application"
                                                  : "applications"
                                          } shown`}
                                </p>
                            </div>

                            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 sm:flex-row sm:items-center">
                                Filter by status

                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value)
                                    }
                                    className="min-w-44 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                >
                                    <option value="all">
                                        All statuses
                                    </option>

                                    {APPLICATION_STATUSES.map((status) => (
                                        <option
                                            key={status}
                                            value={status}
                                        >
                                            {formatStatus(status)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        {/* Success notice */}
                        {notice && (
                            <div
                                role="status"
                                aria-live="polite"
                                className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                            >
                                <span
                                    className="text-lg"
                                    aria-hidden="true"
                                >
                                    ✓
                                </span>

                                <div className="flex-1">{notice}</div>

                                <button
                                    type="button"
                                    onClick={() => setNotice("")}
                                    className="font-semibold hover:text-emerald-950"
                                    aria-label="Dismiss success message"
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        {/* Error notice */}
                        {error && (
                            <div
                                role="alert"
                                className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                            >
                                <p className="font-semibold">
                                    Something went wrong
                                </p>

                                <p className="mt-1">{error}</p>

                                {loadFailed && (
                                    <button
                                        type="button"
                                        onClick={fetchApplications}
                                        disabled={loading}
                                        className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 font-semibold transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading
                                            ? "Retrying..."
                                            : "Try Again"}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Loading state */}
                        {loading ? (
                            <div
                                className="space-y-4"
                                role="status"
                                aria-label="Loading applications"
                            >
                                <ApplicationSkeleton />
                                <ApplicationSkeleton />
                                <ApplicationSkeleton />
                            </div>
                        ) : loadFailed ? (
                            <div className="py-12 text-center">
                                <div
                                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-500"
                                    aria-hidden="true"
                                >
                                    !
                                </div>

                                <h3 className="mt-4 text-lg font-bold text-slate-900">
                                    Applications unavailable
                                </h3>

                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                    We couldn't retrieve your applications.
                                    Check your connection and try again.
                                </p>

                                <button
                                    type="button"
                                    onClick={fetchApplications}
                                    className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >
                                    Retry loading
                                </button>
                            </div>
                        ) : filteredApplications.length === 0 ? (
                            <div className="px-4 py-14 text-center">
                                <div
                                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl text-slate-500"
                                    aria-hidden="true"
                                >
                                    {applications.length === 0 ? "▤" : "⌕"}
                                </div>

                                <h3 className="mt-5 text-xl font-bold text-slate-900">
                                    {applications.length === 0
                                        ? "Your journey starts here"
                                        : "No matching applications"}
                                </h3>

                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                    {applications.length === 0
                                        ? "You haven't applied for any jobs yet. Explore opportunities and submit your first application."
                                        : "There are no applications with this status. Choose another filter to see more results."}
                                </p>

                                {applications.length === 0 ? (
                                    <Link
                                        to="/jobs"
                                        className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                                    >
                                        Find Your Next Job
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter("all")}
                                        className="mt-5 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Clear Filter
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredApplications.map((application) => {
                                    const job = getJob(application);

                                    const status =
                                        application.status || "unknown";

                                    const canWithdraw = [
                                        "applied",
                                        "shortlisted",
                                        "interview",
                                    ].includes(status);

                                    const isWithdrawing =
                                        withdrawingId === application._id;

                                    return (
                                        <article
                                            key={application._id}
                                            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-md sm:p-6"
                                        >
                                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                                <div className="flex min-w-0 gap-4">
                                                    <div
                                                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-lg font-bold text-blue-700"
                                                        aria-hidden="true"
                                                    >
                                                        {(
                                                            job?.company ||
                                                            job?.title ||
                                                            "J"
                                                        )
                                                            .trim()
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <h3 className="break-words text-lg font-bold text-slate-900">
                                                            {job?.title ||
                                                                "Job title unavailable"}
                                                        </h3>

                                                        <p className="mt-1 font-medium text-slate-600">
                                                            {job?.company ||
                                                                "Company unavailable"}
                                                        </p>

                                                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                                                            {job?.location && (
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <span aria-hidden="true">
                                                                        ⌖
                                                                    </span>
                                                                    {job.location}
                                                                </span>
                                                            )}

                                                            {job?.jobType && (
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <span aria-hidden="true">
                                                                        ◷
                                                                    </span>
                                                                    {formatLabel(
                                                                        job.jobType
                                                                    )}
                                                                </span>
                                                            )}

                                                            <span className="inline-flex items-center gap-1.5">
                                                                <span aria-hidden="true">
                                                                    ▦
                                                                </span>
                                                                Applied{" "}
                                                                {formatDate(
                                                                    application.appliedAt ||
                                                                        application.createdAt
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${getStatusStyle(
                                                        status
                                                    )}`}
                                                >
                                                    <span aria-hidden="true">
                                                        {STATUS_ICONS[status] ||
                                                            "•"}
                                                    </span>

                                                    {formatStatus(status)}
                                                </span>
                                            </div>

                                            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                                                {job?._id && (
                                                    <Link
                                                        to={`/jobs/${job._id}`}
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                                    >
                                                        View Job Details
                                                        <span aria-hidden="true">
                                                            →
                                                        </span>
                                                    </Link>
                                                )}

                                                {canWithdraw && (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            withdrawingId !==
                                                            null
                                                        }
                                                        onClick={() =>
                                                            handleWithdraw(
                                                                application._id
                                                            )
                                                        }
                                                        className="inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                    </div>
                </section>

                <p className="mt-6 text-center text-xs leading-5 text-slate-400">
                    Application statuses reflect the latest information
                    available from JobTrack.
                </p>
            </div>
        </main>
    );
}