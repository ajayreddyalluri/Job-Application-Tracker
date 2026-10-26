
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "jobApplications";

const STATUSES = [
  "Applied",
  "Assessment",
  "Interview",
  "Offer",
  "Rejected",
];

function getSavedJobs() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(saved)
      ? saved.map((job) => ({
          ...job,
          appliedDate: job.appliedDate || "",
          status: STATUSES.includes(job.status)
            ? job.status
            : "Applied",
        }))
      : [];
  } catch {
    return [];
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyForm() {
  return {
    company: "",
    role: "",
    status: "Applied",
    appliedDate: today(),
    notes: "",
  };
}

function App() {
  const [jobs, setJobs] = useState(getSavedJobs);
  const [form, setForm] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } catch {
      setMessage("Unable to save data in this browser.");
    }
  }, [jobs]);

  const statistics = useMemo(
    () => ({
      total: jobs.length,
      interviews: jobs.filter(
        (job) => job.status === "Interview"
      ).length,
      offers: jobs.filter(
        (job) => job.status === "Offer"
      ).length,
    }),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        job.company.toLowerCase().includes(query) ||
        job.role.toLowerCase().includes(query);

      const matchesStatus =
        filterStatus === "All" ||
        job.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, filterStatus]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const company = form.company.trim();
    const role = form.role.trim();

    if (!company || !role) {
      setMessage("Please enter both company and job role.");
      return;
    }

    const jobData = {
      company,
      role,
      status: form.status,
      appliedDate: form.appliedDate,
      notes: form.notes.trim(),
    };

    if (editingId !== null) {
      setJobs((previous) =>
        previous.map((job) =>
          job.id === editingId
            ? { ...job, ...jobData }
            : job
        )
      );
      setMessage("Application updated successfully.");
    } else {
      const newJob = {
        id: crypto.randomUUID(),
        ...jobData,
        createdAt: new Date().toISOString(),
      };

      setJobs((previous) => [newJob, ...previous]);
      setMessage("Application added successfully.");
    }

    setForm(createEmptyForm());
    setEditingId(null);
  }

  function editJob(job) {
    setForm({
      company: job.company,
      role: job.role,
      status: job.status,
      appliedDate: job.appliedDate || today(),
      notes: job.notes || "",
    });

    setEditingId(job.id);
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteJob(id) {
    const confirmed = window.confirm(
      "Delete this job application?"
    );

    if (!confirmed) return;

    setJobs((previous) =>
      previous.filter((job) => job.id !== id)
    );

    if (editingId === id) {
      cancelEdit();
    }

    setMessage("Application deleted.");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(createEmptyForm());
    setMessage("");
  }

  return (
    <main className="container">
      <header className="header">
        <div>
          <p className="eyebrow">CAREER DASHBOARD</p>
          <h1>Job Application Tracker</h1>
          <p className="subtitle">
            Organize your applications and track your progress.
          </p>
        </div>

        <span className="count">
          {statistics.total}{" "}
          {statistics.total === 1
            ? "application"
            : "applications"}
        </span>
      </header>

      <section className="stats">
        <article className="stat-card">
          <span>Total applications</span>
          <strong>{statistics.total}</strong>
        </article>

        <article className="stat-card">
          <span>Interviews</span>
          <strong>{statistics.interviews}</strong>
        </article>

        <article className="stat-card">
          <span>Offers</span>
          <strong>{statistics.offers}</strong>
        </article>
      </section>

      <section className="panel">
        <h2>
          {editingId !== null
            ? "Edit application"
            : "Add a job application"}
        </h2>

        <form className="job-form" onSubmit={handleSubmit}>
          <label>
            Company name
            <input
              name="company"
              value={form.company}
              onChange={updateField}
              placeholder="e.g. Infosys"
              required
            />
          </label>

          <label>
            Job role
            <input
              name="role"
              value={form.role}
              onChange={updateField}
              placeholder="e.g. Software Engineer"
              required
            />
          </label>

          <label>
            Application status
            <select
              name="status"
              value={form.status}
              onChange={updateField}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            Application date
            <input
              type="date"
              name="appliedDate"
              value={form.appliedDate}
              onChange={updateField}
              required
            />
          </label>

          <label className="full-width">
            Notes (optional)
            <textarea
              name="notes"
              value={form.notes}
              onChange={updateField}
              placeholder="Recruiter details, interview notes, follow-up..."
              rows={3}
            />
          </label>

          <div className="form-actions full-width">
            <button type="submit">
              {editingId !== null
                ? "Save changes"
                : "Add application"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="secondary-button"
                onClick={cancelEdit}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>

        {message && (
          <p className="message" role="status">
            {message}
          </p>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Your applications</h2>
          <span className="result-count">
            {filteredJobs.length} shown
          </span>
        </div>

        <div className="filters">
          <input
            type="search"
            aria-label="Search applications"
            placeholder="Search company or role..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            aria-label="Filter by status"
            value={filterStatus}
            onChange={(event) =>
              setFilterStatus(event.target.value)
            }
          >
            <option value="All">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {filteredJobs.length === 0 ? (
          <p className="empty">
            {jobs.length === 0
              ? "No applications yet. Add your first job above!"
              : "No matching applications. Try another search or filter."}
          </p>
        ) : (
          <div className="job-list">
            {filteredJobs.map((job) => (
              <article className="job-card" key={job.id}>
                <div className="job-details">
                  <h3>{job.role}</h3>
                  <p className="company-name">{job.company}</p>

                  <div className="job-meta">
                    <span
                      className={`status status-${job.status.toLowerCase()}`}
                    >
                      {job.status}
                    </span>

                    <span className="date">
                      Applied: {job.appliedDate || "Not recorded"}
                    </span>
                  </div>

                  {job.notes && (
                    <p className="notes">{job.notes}</p>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    type="button"
                    className="edit-button"
                    onClick={() => editJob(job)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => deleteJob(job.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="footer">
        Job Application Tracker · Personal career organizer
      </footer>
    </main>
  );
}

export default App;
