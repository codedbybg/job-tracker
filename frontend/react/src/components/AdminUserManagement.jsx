
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  UserCheck,
  UserRound,
  UserX,
  RefreshCw,
  ShieldCheck,
  MapPin,
  CalendarDays,
  ChevronDown,
  X,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  SlidersHorizontal,
  UserCog,
  Trash2,
  Power,
  BriefcaseBusiness,
} from "lucide-react";

import {
  getUsers,
  updateUser,
  deleteUser,
} from "../api/userApi";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Something went wrong. Please try again.";

const getUserList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.users)) return response.users;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.users)) return response.data.users;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const getUserId = (user) => user?._id || user?.id;

const formatDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "U";

const roleStyles = {
  candidate: "bg-violet-50 text-violet-700 ring-violet-600/10",
  recruiter: "bg-blue-50 text-blue-700 ring-blue-600/10",
  admin: "bg-amber-50 text-amber-700 ring-amber-600/10",
};

function StatCard({ label, value, description, icon: IconComponent, color }) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
        >
          <IconComponent size={21} strokeWidth={1.8} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
        roleStyles[role] || "bg-slate-100 text-slate-600 ring-slate-500/10"
      }`}
    >
      {role === "admin" ? (
        <ShieldCheck size={13} />
      ) : role === "recruiter" ? (
        <BriefcaseBusiness size={13} />
      ) : (
        <UserRound size={13} />
      )}
      {role || "Unknown"}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function UserAvatar({ user }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-100 text-sm font-bold text-emerald-800">
      {user.profileImage ? (
        <img
          src={user.profileImage}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(user.name)
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="animate-pulse space-y-4 p-5">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex items-center gap-4 py-2">
          <div className="h-11 w-11 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-36 rounded bg-slate-100" />
            <div className="h-3 w-52 max-w-full rounded bg-slate-100" />
          </div>
          <div className="hidden h-7 w-20 rounded-full bg-slate-100 sm:block" />
          <div className="hidden h-7 w-20 rounded-lg bg-slate-100 md:block" />
        </div>
      ))}
    </div>
  );
}

function Feedback({ message, type, onClose }) {
  if (!message) return null;

  const success = type === "success";

  return (
    <div
      role={success ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-xl border p-4 ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {success ? (
        <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={19} className="mt-0.5 shrink-0" />
      )}

      <p className="flex-1 text-sm font-medium">{message}</p>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function AdminUserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const currentUserId = String(getUserId(currentUser) || "");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getUsers({ page: 1, limit: 100 });
      setUsers(getUserList(response));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !term ||
        [user.name, user.email, user.role, user.location]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesRole =
        roleFilter === "all" || user.role === roleFilter;

      const active = user.isActive !== false;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: users.length,
      candidates: users.filter((u) => u.role === "candidate").length,
      recruiters: users.filter((u) => u.role === "recruiter").length,
      inactive: users.filter((u) => u.isActive === false).length,
    }),
    [users]
  );

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  const handleRoleChange = async (user, newRole) => {
    if (user.role === newRole) return;

    if (!["candidate", "recruiter"].includes(newRole)) {
      setError("Only candidate and recruiter roles can be assigned.");
      return;
    }

    const id = String(getUserId(user));
    setBusyId(id);
    setError("");
    setNotice("");

    try {
      await updateUser(id, { role: newRole });

      setUsers((previous) =>
        previous.map((item) =>
          String(getUserId(item)) === id
            ? { ...item, role: newRole }
            : item
        )
      );

      setNotice(`Role updated to ${newRole}.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (user) => {
    const id = String(getUserId(user));

    if (id === currentUserId) {
      setError("You cannot change your own account status.");
      setConfirmAction(null);
      return;
    }

    const nextStatus = user.isActive === false;
    setBusyId(id);
    setError("");
    setNotice("");
    setConfirmAction(null);

    try {
      await updateUser(id, { isActive: nextStatus });

      setUsers((previous) =>
        previous.map((item) =>
          String(getUserId(item)) === id
            ? { ...item, isActive: nextStatus }
            : item
        )
      );

      setNotice(
        nextStatus
          ? "The account has been activated."
          : "The account has been deactivated."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user) => {
    const id = String(getUserId(user));

    if (id === currentUserId || user.role === "admin") {
      setError("This account cannot be deleted from this screen.");
      setConfirmAction(null);
      return;
    }

    setBusyId(id);
    setError("");
    setNotice("");
    setConfirmAction(null);

    try {
      await deleteUser(id);
      setUsers((previous) =>
        previous.filter((item) => String(getUserId(item)) !== id)
      );
      setNotice("User account deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const hasFilters =
    search.trim() !== "" ||
    roleFilter !== "all" ||
    statusFilter !== "all";

  return (
    <section
      id="user-management"
      className="scroll-mt-24 space-y-6"
    >
      {/* Page heading */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="pointer-events-none absolute right-36 top-16 h-24 w-24 rounded-full bg-teal-100/50 blur-2xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <ShieldCheck size={14} />
              ADMIN CONTROL CENTER
            </div>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              User management
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              Manage your community, review accounts, and control platform
              access from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            disabled={loading || Boolean(busyId)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh users
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={stats.total}
          description="Accounts returned by the API"
          icon={Users}
          color="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Candidates"
          value={stats.candidates}
          description="People looking for opportunities"
          icon={UserRound}
          color="bg-violet-50 text-violet-700"
        />
        <StatCard
          label="Recruiters"
          value={stats.recruiters}
          description="People hiring on JobTrack"
          icon={UserCheck}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="Inactive accounts"
          value={stats.inactive}
          description="Accounts currently deactivated"
          icon={UserX}
          color="bg-red-50 text-red-700"
        />
      </div>

      {/* Feedback */}
      <div className="space-y-3">
        <Feedback
          message={error}
          type="error"
          onClose={() => setError("")}
        />
        <Feedback
          message={notice}
          type="success"
          onClose={() => setNotice("")}
        />
      </div>

      {/* User directory */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                User directory
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Search accounts and manage roles and access.
              </p>
            </div>

            <div className="text-sm text-slate-500">
              <span className="font-bold text-slate-900">
                {filteredUsers.length}
              </span>{" "}
              result{filteredUsers.length === 1 ? "" : "s"}
            </div>
          </div>

          {/* Search and filters */}
          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_190px_auto]">
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, location..."
                aria-label="Search users"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              />
            </div>

            <div className="relative">
              <UserCog
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                aria-label="Filter users by role"
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-9 text-sm text-slate-700 outline-none transition hover:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
              >
                <option value="all">All roles</option>
                <option value="candidate">Candidates</option>
                <option value="recruiter">Recruiters</option>
                <option value="admin">Admins</option>
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <div className="relative">
              <SlidersHorizontal
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter users by status"
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-9 text-sm text-slate-700 outline-none transition hover:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <X size={15} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Desktop user table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50/80">
              <tr className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <th className="px-6 py-4">User</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            {!loading && filteredUsers.length > 0 && (
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const id = String(getUserId(user));
                  const isSelf = id === currentUserId;
                  const isBusy = busyId === id;
                  const active = user.isActive !== false;

                  return (
                    <tr
                      key={id}
                      className="group transition hover:bg-emerald-50/30"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} />
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                              <span className="truncate">
                                {user.name || "Unnamed user"}
                              </span>
                              {isSelf && (
                                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="mt-1 max-w-[230px] truncate text-xs text-slate-500">
                              {user.email || "No email provided"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          <RoleBadge role={user.role} />
                          <div>
                            <label className="sr-only" htmlFor={`role-${id}`}>
                              Change role for {user.name || user.email}
                            </label>
                            <select
                              id={`role-${id}`}
                              value={user.role || "candidate"}
                              onChange={(event) =>
                                handleRoleChange(user, event.target.value)
                              }
                              disabled={
                                isBusy || isSelf || user.role === "admin"
                              }
                              className="max-w-36 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60"
                            >
                              <option value="candidate">Candidate</option>
                              <option value="recruiter">Recruiter</option>
                              {user.role === "admin" && (
                                <option value="admin">Admin</option>
                              )}
                            </select>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge active={active} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <CalendarDays size={15} className="text-slate-400" />
                          {formatDate(user.createdAt)}
                        </div>
                        {user.location && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                            <MapPin size={12} />
                            <span className="max-w-28 truncate">
                              {user.location}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            title={active ? "Deactivate account" : "Activate account"}
                            onClick={() =>
                              setConfirmAction({
                                type: "status",
                                user,
                              })
                            }
                            disabled={isBusy || isSelf}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                              active
                                ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            }`}
                          >
                            {isBusy ? (
                              <LoaderCircle size={14} className="animate-spin" />
                            ) : (
                              <Power size={14} />
                            )}
                            {active ? "Disable" : "Enable"}
                          </button>

                          <button
                            type="button"
                            title="Delete user"
                            onClick={() =>
                              setConfirmAction({
                                type: "delete",
                                user,
                              })
                            }
                            disabled={isBusy || isSelf || user.role === "admin"}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        {/* Mobile user cards */}
        <div className="space-y-3 p-4 md:hidden">
          {loading ? (
            <SkeletonRows />
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const id = String(getUserId(user));
              const isSelf = id === currentUserId;
              const isBusy = busyId === id;
              const active = user.isActive !== false;

              return (
                <article
                  key={id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-200 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <UserAvatar user={user} />

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-bold text-slate-900">
                        {user.name || "Unnamed user"}
                        {isSelf && (
                          <span className="ml-1.5 text-xs font-medium text-emerald-700">
                            (You)
                          </span>
                        )}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {user.email || "No email provided"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <RoleBadge role={user.role} />
                        <StatusBadge active={active} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4">
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-slate-500">
                        User role
                      </span>
                      <select
                        value={user.role || "candidate"}
                        onChange={(event) =>
                          handleRoleChange(user, event.target.value)
                        }
                        disabled={
                          isBusy || isSelf || user.role === "admin"
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 disabled:opacity-50"
                      >
                        <option value="candidate">Candidate</option>
                        <option value="recruiter">Recruiter</option>
                        {user.role === "admin" && (
                          <option value="admin">Admin</option>
                        )}
                      </select>
                    </label>

                    <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        Joined {formatDate(user.createdAt)}
                      </span>
                      {user.location && (
                        <span className="flex min-w-0 items-center gap-1 truncate">
                          <MapPin size={13} />
                          <span className="truncate">{user.location}</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({ type: "status", user })
                        }
                        disabled={isBusy || isSelf}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition disabled:opacity-40 ${
                          active
                            ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        }`}
                      >
                        <Power size={14} />
                        {active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({ type: "delete", user })
                        }
                        disabled={isBusy || isSelf || user.role === "admin"}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : null}
        </div>

        {/* Loading and empty states */}
        {loading && (
          <div className="hidden md:block">
            <SkeletonRows />
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              {users.length === 0 ? (
                <Users size={25} />
              ) : (
                <Search size={25} />
              )}
            </div>
            <h4 className="mt-4 font-bold text-slate-900">
              {users.length === 0
                ? "No user accounts found"
                : "No matching users"}
            </h4>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {users.length === 0
                ? "The API did not return any users. Check the backend response and admin permissions."
                : "Try adjusting your search or filters to find the account you're looking for."}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        {!loading && users.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {filteredUsers.length} of {users.length} loaded accounts
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              Protected admin controls
            </span>
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmAction(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-confirm-title"
            className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                confirmAction.type === "delete"
                  ? "bg-red-50 text-red-600"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {confirmAction.type === "delete" ? (
                <Trash2 size={22} />
              ) : (
                <Power size={22} />
              )}
            </div>

            <h3
              id="user-confirm-title"
              className="mt-5 text-xl font-bold text-slate-900"
            >
              {confirmAction.type === "delete"
                ? "Delete this user?"
                : confirmAction.user.isActive === false
                  ? "Activate this account?"
                  : "Deactivate this account?"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {confirmAction.type === "delete"
                ? `You are about to permanently delete ${
                    confirmAction.user.name ||
                    confirmAction.user.email ||
                    "this user"
                  }. This action cannot be undone.`
                : confirmAction.user.isActive === false
                  ? "This user will regain access according to your platform's account permissions."
                  : "This user may lose access to protected features until their account is reactivated."}
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">
                {confirmAction.user.name || "Unnamed user"}
              </p>
              <p className="mt-1 break-all text-xs text-slate-500">
                {confirmAction.user.email}
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  confirmAction.type === "delete"
                    ? handleDelete(confirmAction.user)
                    : handleStatusChange(confirmAction.user)
                }
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition ${
                  confirmAction.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {confirmAction.type === "delete" ? (
                  <Trash2 size={15} />
                ) : (
                  <Power size={15} />
                )}
                {confirmAction.type === "delete"
                  ? "Confirm delete"
                  : confirmAction.user.isActive === false
                    ? "Activate account"
                    : "Deactivate account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminUserManagement;
