
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function CreateJob() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
  company: "",
  location: "",
  jobType: "full-time",
  description: "",
  requirements: "",
  salaryMin: "",
  salaryMax: "",
  experienceMin: "",
  deadline: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  
const handleSubmit = async (event) => {
  event.preventDefault();
  setError("");
  setLoading(true);

  try {
    const payload = {
      title: form.title.trim(),
      company: form.company.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      jobType: form.jobType,
      deadline: form.deadline,
      skills: form.requirements
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    // Add optional numeric fields only when provided.
    if (form.salaryMin !== "") {
      payload.salaryMin = Number(form.salaryMin);
    }

    if (form.salaryMax !== "") {
      payload.salaryMax = Number(form.salaryMax);
    }

    if (form.experienceMin !== "") {
      payload.experienceMin = Number(form.experienceMin);
    }

    const response = await api.post("/jobs", payload);

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Failed to create job."
      );
    }

    navigate("/dashboard");
} catch (err) {
    const responseData = err.response?.data;

    const validationErrors = responseData?.errors;

    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      setError(
        `${responseData.message || "Job validation failed"}: ${validationErrors.join(", ")}`
      );
    } else {
      setError(
        responseData?.message ||
          err.message ||
          "Unable to create the job."
      );
    }
}
};


  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <Link
          to="/dashboard"
          className="text-sm font-semibold text-blue-700 hover:underline"
        >
          ← Back to dashboard
        </Link>

        <h1 className="mt-5 text-3xl font-bold text-slate-900">
          Post a Job
        </h1>

        <p className="mt-2 text-slate-600">
          Provide the details candidates need to understand this opportunity.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Job title *
            </label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Frontend Developer"
              minLength={3}
              maxLength={100}
              required
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Company *
            </label>
            <input
              id="company"
              name="company"
              value={form.company}
              onChange={handleChange}
              className={inputClass}
              placeholder="Company name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Location *
            </label>
            <input
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Pune or Remote"
              required
            />
          </div>

          <div>
            <label
              htmlFor="jobType"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Employment type *
            </label>
            <select
              id="jobType"
              name="jobType"
              value={form.jobType}
              onChange={handleChange}
              className={inputClass}
              required
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="salary"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Salary (optional)
            </label>
            <input
              id="salary"
              name="salary"
              type="number"
              min="0"
              value={form.salary}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter salary if applicable"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Job description *
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              className={inputClass}
              rows={5}
              placeholder="Describe the role and responsibilities"
              required
            />
          </div>

          <div>
            <label
              htmlFor="requirements"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Requirements *
            </label>
            <textarea
              id="requirements"
              name="requirements"
              value={form.requirements}
              onChange={handleChange}
              className={inputClass}
              rows={4}
              placeholder={"Enter one requirement per line"}
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Put each requirement on a separate line.
            </p>
          </div>

          
<div>
  <label
    htmlFor="deadline"
    className="mb-2 block text-sm font-medium"
  >
    Application Deadline
  </label>

  <input
    id="deadline"
    name="deadline"
    type="date"
    required
    min={new Date().toISOString().split("T")[0]}
    value={form.deadline}
    onChange={(event) =>
      setForm({
        ...form,
        deadline: event.target.value,
      })
    }
    className="w-full rounded-lg border border-gray-300 px-4 py-3"
  />
</div>


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Publishing..." : "Publish Job"}
          </button>
        </form>
      </section>
    </main>
  );
}
