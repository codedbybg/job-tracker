
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getMyJobs } from "../api/jobApi";
import { getMyApplications } from "../api/applicationApi";
import AdminUserManagement from "../components/AdminUserManagement";
import { getAdminStats } from "../api/adminApi";

const getErrorMessage = (error, fallback) =>
    error?.userMessage ||
    error?.response?.data?.message ||
    error?.message ||
    fallback;

const formatStatus = (status) => {
    if (!status) return "Unknown";

    return String(status)
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

const normalizeList = (response, key) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.[key])) return response[key];
    return null;
};

const formatDate = (value) => {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const formatSalary = (job) => {
    const min = Number(job?.salaryMin);
    const max = Number(job?.salaryMax);

    const hasMin = job?.salaryMin !== null &&
        job?.salaryMin !== undefined &&
        job?.salaryMin !== "";

    const hasMax = job?.salaryMax !== null &&
        job?.salaryMax !== undefined &&
        job?.salaryMax !== "";

    const currency = (amount) =>
        `₹${amount.toLocaleString("en-IN")}`;

    if (hasMin && hasMax && Number.isFinite(min) && Number.isFinite(max)) {
        return `${currency(min)} – ${currency(max)}`;
    }

    if (hasMin && Number.isFinite(min)) return `From ${currency(min)}`;
    if (hasMax && Number.isFinite(max)) return `Up to ${currency(max)}`;

    return "Salary not disclosed";
};

const getJobStatusClasses = (status) => {
    switch (String(status || "open").toLowerCase()) {
        case "open":
            return "border-emerald-200 bg-emerald-50 text-emerald-700";
        case "closed":
            return "border-slate-200 bg-slate-100 text-slate-600";
        case "draft":
            return "border-amber-200 bg-amber-50 text-amber-700";
        default:
            return "border-slate-200 bg-slate-50 text-slate-600";
    }
};

const getApplicationStatusClasses = (status) => {
    switch (String(status || "").toLowerCase()) {
        case "selected":
            return "border-emerald-200 bg-emerald-50 text-emerald-700";
        case "shortlisted":
            return "border-sky-200 bg-sky-50 text-sky-700";
        case "interview":
            return "border-violet-200 bg-violet-50 text-violet-700";
        case "rejected":
            return "border-rose-200 bg-rose-50 text-rose-700";
        case "withdrawn":
            return "border-slate-200 bg-slate-100 text-slate-600";
        case "pending":
        case "applied":
            return "border-amber-200 bg-amber-50 text-amber-700";
        default:
            return "border-slate-200 bg-slate-50 text-slate-600";
    }
};

function Icon({ name, className = "h-5 w-5" }) {
    const common = {
        className,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        viewBox: "0 0 24 24",
        "aria-hidden": true,
    };

    const paths = {
        grid: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </>
        ),
        users: (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="10" cy="7" r="4" />
                <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </>
        ),
        briefcase: (
            <>
                <rect x="3" y="7" width="18" height="14" rx="2" />
                <path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2" />
            </>
        ),
        chart: (
            <>
                <path d="M3 3v18h18" />
                <path d="m8 14 4-4 4 3 5-7" />
            </>
        ),
        shield: (
            <>
                <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
        search: (
            <>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
            </>
        ),
        plus: <path d="M12 5v14M5 12h14" />,
        arrow: <path d="M5 12h14m-7-7 7 7-7 7" />,
        location: (
            <>
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
            </>
        ),
        clock: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
            </>
        ),
        check: <path d="m5 12 4 4L19 6" />,
        mail: (
            <>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
            </>
        ),
        logout: (
            <>
                <path d="M10 17l5-5-5-5M15 12H3" />
                <path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" />
            </>
        ),
        calendar: (
            <>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
            </>
        ),
        alert: (
            <>
                <path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" />
                <path d="M12 9v4m0 4h.01" />
            </>
        ),
    };

    return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

function StatCard({
    icon,
    label,
    value,
    hint,
    accent = "blue",
    loading = false,
}) {
    const accents = {
        blue: "bg-blue-50 text-blue-700 ring-blue-100",
        violet: "bg-violet-50 text-violet-700 ring-violet-100",
        amber: "bg-amber-50 text-amber-700 ring-amber-100",
        emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        rose: "bg-rose-50 text-rose-700 ring-rose-100",
    };

    return (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50 sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
                        {loading ? (
                            <span className="inline-block h-9 w-14 animate-pulse rounded-lg bg-slate-100" />
                        ) : (
                            value
                        )}
                    </p>
                </div>

                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${accents[accent] || accents.blue}`}
                >
                    <Icon name={icon} className="h-6 w-6" />
                </div>
            </div>

            {hint && (
                <p className="mt-4 text-xs leading-5 text-slate-500">{hint}</p>
            )}
        </article>
    );
}

function SectionHeading({ eyebrow, title, description, action }) {
    return (
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
                {eyebrow && (
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                        {eyebrow}
                    </p>
                )}
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {title}
                </h2>
                {description && (
                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}

function EmptyState({ icon = "grid", title, description, action }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Icon name={icon} className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {description}
            </p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

function ErrorPanel({ message, onRetry }) {
    return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                    <div>
                        <p className="font-semibold text-rose-800">Unable to load data</p>
                        <p className="mt-1 text-sm leading-6 text-rose-700">{message}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus:outline-none focus:ring-4 focus:ring-rose-100"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}

function JobCard({ job, isAdmin }) {
    const stats = job.applicantStats || {};

    const metrics = [
        {
            label: "Applicants",
            value: stats.totalApplicants ?? job.applicantsCount ?? 0,
        },
        { label: "Shortlisted", value: stats.shortlisted ?? 0 },
        { label: "Interviews", value: stats.interview ?? 0 },
        { label: "Selected", value: stats.selected ?? 0 },
    ];

    return (
        <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/50 sm:p-6">
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-lg font-extrabold text-blue-700">
                    {(job.company || job.title || "J").charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="break-words text-lg font-bold leading-6 text-slate-900 transition group-hover:text-blue-700">
                            {job.title || "Untitled job"}
                        </h3>

                        <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${getJobStatusClasses(job.status)}`}
                        >
                            {formatStatus(job.status || "open")}
                        </span>
                    </div>

                    <p className="mt-1 text-sm font-medium text-slate-500">
                        {job.company || "Company not specified"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                            <Icon name="location" className="h-4 w-4" />
                            {job.location || "Location not specified"}
                        </span>

                        {job.jobType && (
                            <span className="inline-flex items-center gap-1.5">
                                <Icon name="briefcase" className="h-4 w-4" />
                                {formatStatus(job.jobType)}
                            </span>
                        )}

                        <span className="inline-flex items-center gap-1.5">
                            <Icon name="calendar" className="h-4 w-4" />
                            Posted {formatDate(job.createdAt)}
                        </span>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                        {formatSalary(job)}
                    </p>

                    {isAdmin && job.recruiter && (
                        <p className="mt-2 break-all text-xs text-slate-500">
                            Recruiter:{" "}
                            {typeof job.recruiter === "object"
                                ? job.recruiter.name || job.recruiter.email || "Recruiter information available"
                                : "Recruiter assigned"}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-xl bg-slate-50 p-3.5 transition group-hover:bg-blue-50/60">
                        <p className="text-[11px] font-semibold text-slate-500">
                            {metric.label}
                        </p>
                        <p className="mt-1 text-xl font-extrabold text-slate-900">
                            {metric.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                <Link
                    to={`/jobs/${job._id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:flex-none"
                >
                    View job
                </Link>

                <Link
                    to={`/recruiter/jobs/${job._id}/applicants`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:flex-none"
                >
                    Manage applicants <Icon name="arrow" className="h-4 w-4" />
                </Link>
            </div>
        </article>
    );
}

export default function Dashboard() {
    const { user, logout } = useAuth();

    const [jobs, setJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [jobsError, setJobsError] = useState("");

    const [applications, setApplications] = useState([]);
    const [applicationsLoading, setApplicationsLoading] = useState(false);
    const [applicationsError, setApplicationsError] = useState("");

    const [adminStats, setAdminStats] = useState(null);
    const [adminStatsLoading, setAdminStatsLoading] = useState(false);
    const [adminStatsError, setAdminStatsError] = useState("");

    const [jobSearch, setJobSearch] = useState("");

    const isCandidate = user?.role === "candidate";
    const isRecruiter = user?.role === "recruiter";
    const isAdmin = user?.role === "admin";
    const canManageJobs = isRecruiter || isAdmin;

    const loadJobs = useCallback(async () => {
        setJobsLoading(true);
        setJobsError("");

        try {
            const response = await getMyJobs();
            const list = normalizeList(response, "jobs");

            if (!list) {
                throw new Error("The server returned an unexpected jobs response.");
            }

            setJobs(list);
        } catch (error) {
            setJobsError(getErrorMessage(error, "Failed to load job listings."));
        } finally {
            setJobsLoading(false);
        }
    }, []);

    const loadApplications = useCallback(async () => {
        setApplicationsLoading(true);
        setApplicationsError("");

        try {
            const response = await getMyApplications();
            const list = normalizeList(response, "applications");

            if (!list) {
                throw new Error("The server returned an unexpected applications response.");
            }

            setApplications(list);
        } catch (error) {
            setApplicationsError(
                getErrorMessage(error, "Failed to load your applications.")
            );
        } finally {
            setApplicationsLoading(false);
        }
    }, []);

    const loadAdminStats = useCallback(async () => {
    setAdminStatsLoading(true);
    setAdminStatsError("");

    try {
        const response = await getAdminStats();

        if (!response?.success || !response?.data?.users ||
            !response?.data?.jobs || !response?.data?.applications) {
            throw new Error("The server returned an unexpected statistics response.");
        }

        setAdminStats(response.data);
    } catch (error) {
        setAdminStatsError(
            getErrorMessage(error, "Failed to load platform statistics.")
        );
    } finally {
        setAdminStatsLoading(false);
    }
}, []);

useEffect(() => {
    if (isAdmin) {
        loadAdminStats();
    }
}, [isAdmin, loadAdminStats]);

    useEffect(() => {
        if (canManageJobs) loadJobs();
    }, [canManageJobs, loadJobs]);

    useEffect(() => {
        if (isCandidate) loadApplications();
    }, [isCandidate, loadApplications]);

    const recruiterStats = useMemo(
        () =>
            jobs.reduce(
                (totals, job) => {
                    const stats = job.applicantStats || {};

                    totals.totalApplicants += Number(stats.totalApplicants || 0);
                    totals.shortlisted += Number(stats.shortlisted || 0);
                    totals.interviews += Number(stats.interview || 0);
                    totals.selected += Number(stats.selected || 0);
                    totals.openJobs += String(job.status || "open").toLowerCase() === "open" ? 1 : 0;

                    return totals;
                },
                {
                    totalApplicants: 0,
                    shortlisted: 0,
                    interviews: 0,
                    selected: 0,
                    openJobs: 0,
                }
            ),
        [jobs]
    );

    const candidateStats = useMemo(
        () => ({
            total: applications.length,
            pending: applications.filter((application) =>
                ["applied", "pending"].includes(
                    String(application.status || "").toLowerCase()
                )
            ).length,
            shortlisted: applications.filter(
                (application) => String(application.status).toLowerCase() === "shortlisted"
            ).length,
            interviews: applications.filter(
                (application) => String(application.status).toLowerCase() === "interview"
            ).length,
            selected: applications.filter(
                (application) => String(application.status).toLowerCase() === "selected"
            ).length,
        }),
        [applications]
    );

    const filteredJobs = useMemo(() => {
        const query = jobSearch.trim().toLowerCase();

        if (!query) return jobs;

        return jobs.filter((job) =>
            [
                job.title,
                job.company,
                job.location,
                typeof job.recruiter === "object" ? job.recruiter?.name : "",
                typeof job.recruiter === "object" ? job.recruiter?.email : "",
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
        );
    }, [jobs, jobSearch]);

    const recentApplications = useMemo(
        () =>
            [...applications]
                .sort((a, b) => {
                    const dateA = new Date(a.appliedAt || a.createdAt || 0).getTime();
                    const dateB = new Date(b.appliedAt || b.createdAt || 0).getTime();

                    return dateB - dateA;
                })
                .slice(0, 5),
        [applications]
    );

    const displayName = user?.name?.trim()?.split(/\s+/)[0] || "there";
    const roleLabel = formatStatus(user?.role || "member");

    return (
        <main className="min-h-screen bg-[#f5f7fb] text-slate-800">
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
                    <Link to="/" className="inline-flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black text-white shadow-md shadow-blue-600/20">
                            J
                        </span>
                        <span>
                            <span className="block text-lg font-extrabold tracking-tight text-slate-900">
                                Job<span className="text-blue-600">Track</span>
                            </span>
                            <span className="hidden text-[11px] font-semibold tracking-wide text-slate-400 sm:block">
                                YOUR CAREER, IN MOTION
                            </span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden text-right sm:block">
                            <p className="max-w-48 truncate text-sm font-semibold text-slate-800">
                                {user?.name || "Account"}
                            </p>
                            <p className="text-xs text-slate-500">{roleLabel} account</p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold uppercase text-blue-700 ring-4 ring-blue-50">
                            {(user?.name || user?.email || "U").trim().charAt(0)}
                        </div>

                        <button
                            type="button"
                            onClick={logout}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-4 focus:ring-slate-100 sm:px-4"
                        >
                            <Icon name="logout" className="h-4 w-4" />
                            <span className="hidden sm:inline">Log out</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
                {/* Role-specific welcome banner */}
                <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 px-6 py-8 text-white shadow-xl shadow-blue-950/10 sm:px-9 sm:py-10 lg:px-10">
                    <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
                    <div className="pointer-events-none absolute -right-2 -top-12 h-56 w-56 rounded-full border border-white/10" />
                    <div className="pointer-events-none absolute -bottom-28 right-1/4 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

                    <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
                        <div className="max-w-2xl">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100 backdrop-blur">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                {isAdmin
                                    ? "Administrator workspace"
                                    : isRecruiter
                                        ? "Recruiter workspace"
                                        : "Candidate workspace"}
                            </span>

                            <h1 className="mt-5 break-words text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                                {isAdmin
                                    ? <>Welcome back, {displayName}<span className="text-blue-300">.</span></>
                                    : isRecruiter
                                        ? <>Your hiring hub, {displayName}<span className="text-blue-300">.</span></>
                                        : <>Your next chapter, {displayName}<span className="text-blue-300">.</span></>}
                            </h1>

                            <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100/80 sm:text-base">
                                {isAdmin
                                    ? "Oversee job activity, review listings across your platform, and keep JobTrack running smoothly."
                                    : isRecruiter
                                        ? "Manage your job listings, review applicants, and keep promising candidates moving."
                                        : "Track applications, discover new opportunities, and stay up to date with your career journey."}
                            </p>

                            {user?.email && (
                                <p className="mt-4 break-all text-xs font-medium text-blue-200/70">
                                    Signed in as {user.email}
                                </p>
                            )}
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-3">
                            {isCandidate && (
                                <>
                                    <Link
                                        to="/jobs"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                                    >
                                        <Icon name="search" className="h-4 w-4" />
                                        Find jobs
                                    </Link>
                                    <Link
                                        to="/my-applications"
                                        className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                                    >
                                        My applications
                                    </Link>
                                </>
                            )}

                            {isRecruiter && (
                                <>
                                    <Link
                                        to="/jobs/create"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                                    >
                                        <Icon name="plus" className="h-4 w-4" />
                                        Post a job
                                    </Link>
                                    <Link
                                        to="/jobs"
                                        className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                                    >
                                        Browse jobs
                                    </Link>
                                </>
                            )}

                            {isAdmin && (
                                <>
                                    <a
                                        href="#platform-jobs"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                                    >
                                        <Icon name="briefcase" className="h-4 w-4" />
                                        Manage listings
                                    </a>
                                    <Link
                                        to="/jobs"
                                        className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                                    >
                                        Browse jobs
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* Account information */}
                <section className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <article className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <Icon name="mail" className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Account email
                            </p>
                            <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                                {user?.email || "Not available"}
                            </p>
                        </div>
                    </article>

                    <article className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isAdmin ? "bg-violet-50 text-violet-700" : "bg-indigo-50 text-indigo-700"}`}>
                            <Icon name={isAdmin ? "shield" : "briefcase"} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Account type
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                {roleLabel}
                            </p>
                        </div>
                    </article>
                </section>

                {/* ADMIN DASHBOARD */}
                {isAdmin && (
                    <div className="space-y-9">
                        
<section>
    <SectionHeading
        eyebrow="Platform overview"
        title="JobTrack administration"
        description="Monitor platform-wide users, job listings, and application activity."
        action={
            <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-xs font-bold text-violet-700">
                    <Icon name="shield" className="h-4 w-4" />
                    Admin access
                </span>

                <button
                    type="button"
                    onClick={loadAdminStats}
                    disabled={adminStatsLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Icon name="clock" className="h-4 w-4" />
                    {adminStatsLoading ? "Refreshing..." : "Refresh stats"}
                </button>
            </div>
        }
    />

    {adminStatsError && (
        <div className="mb-5">
            <ErrorPanel
                message={adminStatsError}
                onRetry={loadAdminStats}
            />
        </div>
    )}

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
            icon="users"
            label="Total users"
            value={adminStats?.users?.total ?? 0}
            hint="All registered platform accounts"
            accent="blue"
            loading={adminStatsLoading && !adminStats}
        />

        <StatCard
            icon="briefcase"
            label="Total jobs"
            value={adminStats?.jobs?.total ?? 0}
            hint={`${adminStats?.jobs?.open ?? 0} open · ${adminStats?.jobs?.closed ?? 0} closed`}
            accent="violet"
            loading={adminStatsLoading && !adminStats}
        />

        <StatCard
            icon="clock"
            label="Applications"
            value={adminStats?.applications?.total ?? 0}
            hint="Excludes withdrawn applications"
            accent="amber"
            loading={adminStatsLoading && !adminStats}
        />

        <StatCard
            icon="check"
            label="Selected candidates"
            value={adminStats?.applications?.selected ?? 0}
            hint="Applications marked selected"
            accent="emerald"
            loading={adminStatsLoading && !adminStats}
        />
    </div>

    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Candidates</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {adminStatsLoading && !adminStats
                    ? "—"
                    : adminStats?.users?.candidates ?? 0}
            </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Recruiters</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {adminStatsLoading && !adminStats
                    ? "—"
                    : adminStats?.users?.recruiters ?? 0}
            </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Active users</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {adminStatsLoading && !adminStats
                    ? "—"
                    : adminStats?.users?.active ?? 0}
            </p>
        </div>
    </div>
</section>


                        <section>
                            <SectionHeading
                                eyebrow="Administrative shortcuts"
                                title="Manage your platform"
                                description="Quick access to the existing JobTrack features."
                            />

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <Link
                                    to="/jobs"
                                    className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
                                >
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                        <Icon name="briefcase" className="h-5 w-5" />
                                    </div>
                                    <h3 className="mt-4 font-bold text-slate-900">All job listings</h3>
                                    <p className="mt-1 text-sm leading-6 text-slate-500">
                                        Browse available jobs and inspect listing details.
                                    </p>
                                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600">
                                        Browse jobs <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
                                    </span>
                                </Link>

                                <a
                                    href="#platform-jobs"
                                    className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:p-6"
                                >
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                                        <Icon name="chart" className="h-5 w-5" />
                                    </div>
                                    <h3 className="mt-4 font-bold text-slate-900">Hiring activity</h3>
                                    <p className="mt-1 text-sm leading-6 text-slate-500">
                                        Review applicant metrics and job-level activity.
                                    </p>
                                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700">
                                        View activity <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
                                    </span>
                                </a>

                                <article className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 sm:p-6">
                                    
<a
    href="#user-management"
    className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-6"
>
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <Icon name="users" className="h-5 w-5" />
    </div>

    <h3 className="mt-4 font-bold text-slate-900">
        User management
    </h3>

    <p className="mt-1 text-sm leading-6 text-slate-500">
        View user accounts, update eligible roles, control account access,
        and remove eligible accounts.
    </p>

    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
        Manage users
        <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
    </span>
</a>

                                </article>
                            </div>
                        </section>
                        <AdminUserManagement currentUser={user} />

                        <section id="platform-jobs" className="scroll-mt-28">
                            <SectionHeading
                                eyebrow="Platform listings"
                                title="Job listings"
                                description="Search the jobs returned by the backend. Use the backend's Admin authorization to ensure the results include all recruiters' listings."
                                action={
                                    <button
                                        type="button"
                                        onClick={loadJobs}
                                        disabled={jobsLoading}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Icon name="clock" className="h-4 w-4" />
                                        Refresh
                                    </button>
                                }
                            />

                            {!jobsLoading && !jobsError && jobs.length > 0 && (
                                <div className="mb-5">
                                    <label htmlFor="admin-job-search" className="sr-only">
                                        Search job listings
                                    </label>
                                    <div className="relative max-w-lg">
                                        <Icon
                                            name="search"
                                            className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                                        />
                                        <input
                                            id="admin-job-search"
                                            type="search"
                                            value={jobSearch}
                                            onChange={(event) => setJobSearch(event.target.value)}
                                            placeholder="Search by title, company, location or recruiter..."
                                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                                        />
                                    </div>
                                </div>
                            )}

                            {jobsLoading ? (
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    {[1, 2, 3, 4].map((item) => (
                                        <div key={item} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
                                            <div className="h-5 w-2/3 rounded bg-slate-100" />
                                            <div className="mt-3 h-4 w-1/3 rounded bg-slate-100" />
                                            <div className="mt-7 h-20 rounded-xl bg-slate-100" />
                                        </div>
                                    ))}
                                </div>
                            ) : jobsError ? (
                                <ErrorPanel message={jobsError} onRetry={loadJobs} />
                            ) : filteredJobs.length === 0 ? (
                                <EmptyState
                                    icon="briefcase"
                                    title={jobs.length === 0 ? "No job listings found" : "No matching listings"}
                                    description={
                                        jobs.length === 0
                                            ? "No jobs were returned by the API. Check your backend query and confirm Admin access returns the expected listings."
                                            : "Try another search term to find a listing."
                                    }
                                    action={
                                        jobs.length === 0 ? (
                                            <Link
                                                to="/jobs"
                                                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                                            >
                                                Browse jobs
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setJobSearch("")}
                                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                                            >
                                                Clear search
                                            </button>
                                        )
                                    }
                                />
                            ) : (
                                <>
                                    <p className="mb-4 text-sm text-slate-500">
                                        Showing <strong className="text-slate-800">{filteredJobs.length}</strong> of{" "}
                                        <strong className="text-slate-800">{jobs.length}</strong> returned listings
                                    </p>
                                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                        {filteredJobs.map((job) => (
                                            <JobCard key={job._id} job={job} isAdmin />
                                        ))}
                                    </div>
                                </>
                            )}
                        </section>
                    </div>
                )}

                {/* RECRUITER DASHBOARD */}
                {isRecruiter && (
                    <div className="space-y-9">
                        <section>
                            <SectionHeading
                                eyebrow="Hiring overview"
                                title="Your hiring at a glance"
                                description="Track your listings and applicant progress."
                                action={
                                    <Link
                                        to="/jobs/create"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                                    >
                                        <Icon name="plus" className="h-4 w-4" />
                                        Create job
                                    </Link>
                                }
                            />

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <StatCard icon="briefcase" label="Jobs posted" value={jobs.length} hint="Your current listings" accent="blue" loading={jobsLoading} />
                                <StatCard icon="users" label="Applicants" value={recruiterStats.totalApplicants} hint="Across your listings" accent="violet" loading={jobsLoading} />
                                <StatCard icon="clock" label="Interviews" value={recruiterStats.interviews} hint="Candidates at interview stage" accent="amber" loading={jobsLoading} />
                                <StatCard icon="check" label="Selected" value={recruiterStats.selected} hint="Successful selections" accent="emerald" loading={jobsLoading} />
                            </div>
                        </section>

                        <section>
                            <SectionHeading
                                eyebrow="Your workspace"
                                title="Your posted jobs"
                                description="Open a listing to review its details or manage applicants."
                                action={
                                    <Link to="/jobs" className="text-sm font-bold text-blue-600 hover:text-blue-800">
                                        Browse jobs →
                                    </Link>
                                }
                            />

                            {jobsLoading ? (
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    {[1, 2].map((item) => (
                                        <div key={item} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
                                            <div className="h-5 w-2/3 rounded bg-slate-100" />
                                            <div className="mt-3 h-4 w-1/3 rounded bg-slate-100" />
                                            <div className="mt-7 h-20 rounded-xl bg-slate-100" />
                                        </div>
                                    ))}
                                </div>
                            ) : jobsError ? (
                                <ErrorPanel message={jobsError} onRetry={loadJobs} />
                            ) : jobs.length === 0 ? (
                                <EmptyState
                                    icon="briefcase"
                                    title="Your first job starts here"
                                    description="Create a job listing to share an opportunity and start receiving applications."
                                    action={
                                        <Link to="/jobs/create" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
                                            Create your first job →
                                        </Link>
                                    }
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                    {jobs.map((job) => <JobCard key={job._id} job={job} isAdmin={false} />)}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* CANDIDATE DASHBOARD */}
                {isCandidate && (
                    <div className="space-y-9">
                        <section>
                            <SectionHeading
                                eyebrow="Your progress"
                                title="Application overview"
                                description="Track your progress from application to interview and beyond."
                                action={
                                    <Link to="/my-applications" className="text-sm font-bold text-blue-600 hover:text-blue-800">
                                        View all applications →
                                    </Link>
                                }
                            />

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <StatCard icon="briefcase" label="Applications" value={candidateStats.total} hint="Applications submitted" accent="blue" loading={applicationsLoading} />
                                <StatCard icon="clock" label="Pending review" value={candidateStats.pending} hint="Waiting for an update" accent="amber" loading={applicationsLoading} />
                                <StatCard icon="users" label="Shortlisted" value={candidateStats.shortlisted} hint="Your profile caught attention" accent="violet" loading={applicationsLoading} />
                                <StatCard icon="check" label="Selected" value={candidateStats.selected} hint="Successful selections" accent="emerald" loading={applicationsLoading} />
                            </div>
                        </section>

                        <section>
                            <SectionHeading
                                eyebrow="Stay up to date"
                                title="Recent applications"
                                description="Your five most recent applications and their current status."
                                action={
                                    <Link to="/my-applications" className="text-sm font-bold text-blue-600 hover:text-blue-800">
                                        Application history →
                                    </Link>
                                }
                            />

                            {applicationsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((item) => (
                                        <div key={item} className="flex animate-pulse items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                                            <div className="h-12 w-12 rounded-xl bg-slate-100" />
                                            <div className="flex-1">
                                                <div className="h-4 w-1/2 rounded bg-slate-100" />
                                                <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : applicationsError ? (
                                <ErrorPanel message={applicationsError} onRetry={loadApplications} />
                            ) : recentApplications.length === 0 ? (
                                <EmptyState
                                    icon="search"
                                    title="Your next opportunity is waiting"
                                    description="You haven't applied to any jobs yet. Explore available roles and take the next step in your career."
                                    action={
                                        <Link to="/jobs" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
                                            Explore available jobs →
                                        </Link>
                                    }
                                />
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                                    <div className="divide-y divide-slate-100">
                                        {recentApplications.map((application) => {
                                            const job =
                                                application.job && typeof application.job === "object"
                                                    ? application.job
                                                    : null;

                                            return (
                                                <article key={application._id} className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                                    <div className="flex min-w-0 items-start gap-4">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-lg font-bold text-blue-700">
                                                            {(job?.company || job?.title || "J").charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="break-words font-bold text-slate-900">
                                                                {job?.title || "Job title unavailable"}
                                                            </h3>
                                                            <p className="mt-1 text-sm text-slate-500">
                                                                {job?.company || "Company unavailable"}
                                                            </p>
                                                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                                                                {job?.location && <span>{job.location}</span>}
                                                                <span>
                                                                    Applied {formatDate(application.appliedAt || application.createdAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                                                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getApplicationStatusClasses(application.status)}`}>
                                                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                            {formatStatus(application.status)}
                                                        </span>
                                                        {job?._id && (
                                                            <Link to={`/jobs/${job._id}`} className="text-sm font-bold text-blue-600 hover:text-blue-800">
                                                                View job →
                                                            </Link>
                                                        )}
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>

                                    {applications.length > 5 && (
                                        <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-center">
                                            <Link to="/my-applications" className="text-sm font-bold text-blue-600 hover:text-blue-800">
                                                View all {applications.length} applications →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                                    Keep moving forward
                                </p>
                                <h2 className="mt-2 text-lg font-bold text-slate-900">
                                    Find a role that fits your next chapter.
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                    Explore new listings and keep your application history organized.
                                </p>
                            </div>
                            <Link to="/jobs" className="mt-5 inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 sm:mt-0">
                                Explore jobs →
                            </Link>
                        </section>
                    </div>
                )}

                {!isCandidate && !isRecruiter && !isAdmin && (
                    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                        <h2 className="text-lg font-bold text-amber-900">Dashboard unavailable</h2>
                        <p className="mt-2 text-sm leading-6 text-amber-800">
                            Your account role could not be identified. Please log in again or contact the administrator.
                        </p>
                    </section>
                )}

                <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
                    © {new Date().getFullYear()} JobTrack. Built to move your career forward.
                </footer>
            </div>
        </main>
    );
}
