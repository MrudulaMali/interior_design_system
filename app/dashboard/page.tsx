"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { EnquiryStatus } from "@/db/schema";

interface Enquiry {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  propertyType: string;
  propertySize: string | null;
  bedrooms: string | null;
  designStyle: string | null;
  rooms: string[];
  budget: string;
  startDate: string | null;
  description: string | null;
  contactMethod: string;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
}

interface Counts {
  total: number;
  new: number;
  contacted: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

const emptyCounts: Counts = {
  total: 0,
  new: 0,
  contacted: 0,
  in_progress: 0,
  completed: 0,
  cancelled: 0,
};

const statusOptions: { value: EnquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const statusStyles: Record<EnquiryStatus, string> = {
  new: "bg-blue-50 text-blue-700 border border-blue-200",
  contacted: "bg-amber-50 text-amber-700 border border-amber-200",
  in_progress: "bg-purple-50 text-purple-700 border border-purple-200",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-gray-100 text-gray-600 border border-gray-200",
};

const statCards: {
  label: string;
  key: keyof Counts;
  description: string;
}[] = [
  {
    label: "Total enquiries",
    key: "total",
    description: "All recorded enquiries in PostgreSQL",
  },
  {
    label: "New enquiries",
    key: "new",
    description: "Awaiting first response",
  },
  {
    label: "In progress",
    key: "in_progress",
    description: "Currently being consulted",
  },
  {
    label: "Completed",
    key: "completed",
    description: "Successfully finalized projects",
  },
];

function formatDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [counts, setCounts] = useState<Counts>(emptyCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/enquiries", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load dashboard.");
      }

      setEnquiries(data.enquiries || []);
      setCounts(data.counts || emptyCounts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function updateStatus(id: number, status: EnquiryStatus) {
    setUpdatingId(id);
    setNotice("");

    try {
      const response = await fetch("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Status update failed.");
      }

      setNotice(`Enquiry #${id} status updated to ${status}.`);
      await loadDashboard();

      setSelected((previous) =>
        previous?.id === id ? data.enquiry : previous
      );
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Unable to update status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteEnquiry(id: number) {
    if (!window.confirm(`Are you sure you want to delete enquiry #${id}?`)) {
      return;
    }

    setDeletingId(id);
    setNotice("");

    try {
      const response = await fetch(`/api/enquiries?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete enquiry.");
      }

      setNotice(`Enquiry #${id} deleted successfully.`);
      if (selected?.id === id) {
        setSelected(null);
      }
      await loadDashboard();
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Unable to delete enquiry."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredEnquiries = enquiries.filter((enquiry) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      [
        enquiry.fullName,
        enquiry.email,
        enquiry.phone,
        enquiry.city,
        enquiry.propertyType,
        String(enquiry.id),
      ].some((value) => value.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === "all" || enquiry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#292D2B]">
      {/* Top action bar */}
      <div className="border-b border-[#EAE7E0] bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14594c] text-lg font-semibold text-white">
              ▧
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#173F36]">
                Enquiry Dashboard
              </h1>
              <p className="text-xs text-[#777C74]">
                PostgreSQL + Drizzle ORM Live Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/enquiry"
              className="rounded-lg border border-[#14594c] bg-white px-4 py-2 text-xs font-semibold text-[#14594c] transition hover:bg-[#e9f0e9]"
            >
              + Submit New Enquiry
            </Link>

            <button
              onClick={() => void loadDashboard()}
              disabled={loading}
              className="rounded-lg bg-[#14594c] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0c4037] disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "↻ Refresh Data"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 sm:py-10">
        {/* Errors and notifications */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              onClick={() => void loadDashboard()}
              className="font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-[#D9E6DC] bg-[#EDF4EF] p-4 text-sm text-[#14594c]"
          >
            {notice}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card, index) => (
            <div
              key={card.key}
              className="rounded-2xl border border-[#EAE6DE] bg-white p-5 sm:p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#72766F]">
                  {card.label}
                </p>

                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                    index === 0
                      ? "bg-[#EAF1EC] text-[#14594c]"
                      : index === 1
                        ? "bg-blue-50 text-blue-700"
                        : index === 2
                          ? "bg-purple-50 text-purple-700"
                          : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {["#", "N", "P", "✓"][index]}
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold tracking-tight text-[#173F36]">
                {loading ? "—" : counts[card.key].toLocaleString("en-IN")}
              </p>

              <p className="mt-2 text-xs text-[#92948D]">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        {/* Status filter overview */}
        <div className="mb-8 rounded-2xl border border-[#EAE6DE] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[#173F36]">
                Filter by Status:
              </h2>
              <p className="text-xs text-[#777C74]">
                Showing {filteredEnquiries.length} of {counts.total} enquiries
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === "all"
                    ? "bg-[#14594c] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({counts.total})
              </button>
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() =>
                    setStatusFilter((previous) =>
                      previous === status.value ? "all" : status.value
                    )
                  }
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    statusFilter === status.value
                      ? "ring-2 ring-[#14594c] ring-offset-2"
                      : ""
                  } ${statusStyles[status.value]}`}
                >
                  {status.label} ({counts[status.value]})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enquiries table section */}
        <section className="overflow-hidden rounded-2xl border border-[#EAE6DE] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#EEEAE3] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-[#173F36]">
                Customer Enquiries
              </h2>
              <p className="mt-1 text-xs text-[#85877F]">
                Review customer details, change status, or delete enquiries.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, city..."
                aria-label="Search enquiries"
                className="w-full rounded-lg border border-[#E6E2DA] px-4 py-2 text-xs outline-none transition focus:border-[#14594c] sm:w-64"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="rounded-lg border border-[#E6E2DA] bg-white px-3 py-2 text-xs outline-none focus:border-[#14594c]"
              >
                <option value="all">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-[#85877F]">
              Loading enquiries from PostgreSQL database...
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF4EF] text-2xl text-[#14594c]">
                ◇
              </div>
              <h3 className="mt-4 font-semibold text-[#173F36]">
                No enquiries found
              </h3>
              <p className="mt-2 text-xs text-[#85877F]">
                {enquiries.length === 0
                  ? "New customer enquiries will appear here once submitted."
                  : "No enquiries match your current search or status filter."}
              </p>
              <Link
                href="/enquiry"
                className="mt-4 inline-flex rounded-lg bg-[#14594c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c4037]"
              >
                Submit an enquiry
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-[#FAF9F6]">
                  <tr className="border-b border-[#EEEAE3] text-[11px] uppercase tracking-wider text-[#85877F]">
                    <th className="px-5 py-3 font-semibold">ID</th>
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Property</th>
                    <th className="px-5 py-3 font-semibold">Location</th>
                    <th className="px-5 py-3 font-semibold">Budget</th>
                    <th className="px-5 py-3 font-semibold">Submitted</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F0EDE6]">
                  {filteredEnquiries.map((enquiry) => (
                    <tr
                      key={enquiry.id}
                      className="transition hover:bg-[#FCFBF8]"
                    >
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-[#14594c]">
                        #{enquiry.id}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF1EC] text-xs font-bold text-[#14594c]">
                            {enquiry.fullName.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[#333A36]">
                              {enquiry.fullName}
                            </p>
                            <p className="mt-0.5 text-xs text-[#85877F]">
                              {enquiry.email} · {enquiry.phone}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-[#333A36]">
                          {enquiry.propertyType}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#85877F]">
                          {enquiry.propertySize || "Size not specified"}
                          {enquiry.designStyle ? ` · ${enquiry.designStyle}` : ""}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-[#62665F]">
                        {enquiry.city}
                      </td>

                      <td className="px-5 py-4 text-xs font-bold text-[#173F36]">
                        {enquiry.budget}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#62665F]">
                        {formatDate(enquiry.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={enquiry.status}
                          disabled={updatingId === enquiry.id}
                          onChange={(e) =>
                            void updateStatus(
                              enquiry.id,
                              e.target.value as EnquiryStatus
                            )
                          }
                          aria-label={`Status for enquiry ${enquiry.id}`}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold outline-none cursor-pointer disabled:opacity-50 ${
                            statusStyles[enquiry.status]
                          }`}
                        >
                          {statusOptions.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelected(enquiry)}
                            className="rounded-lg border border-[#DCE4DD] bg-white px-3 py-1.5 text-xs font-semibold text-[#14594c] transition hover:bg-[#EDF4EF]"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => void deleteEnquiry(enquiry.id)}
                            disabled={deletingId === enquiry.id}
                            title="Delete enquiry"
                            className="rounded-lg border border-red-200 bg-white px-2 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-[#EEEAE3] px-5 py-3 text-xs text-[#85877F]">
            {loading
              ? "Fetching records from PostgreSQL..."
              : `Displaying ${filteredEnquiries.length} enquiry record(s).`}
          </div>
        </section>
      </div>

      {/* Enquiry Details Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-dialog-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-[#EEEAE3] bg-white p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#85877F]">
                  Enquiry Reference #{selected.id}
                </p>
                <h2
                  id="enquiry-dialog-title"
                  className="mt-1 text-xl font-bold text-[#173F36]"
                >
                  {selected.fullName}
                </h2>
              </div>

              <button
                onClick={() => setSelected(null)}
                aria-label="Close details"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F7F5F0] text-lg font-bold text-[#62665F] hover:bg-[#EDE9E0]"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#14594c]">
                  Client Contact
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  <Detail label="Email Address" value={selected.email} />
                  <Detail label="Phone Number" value={selected.phone} />
                  <Detail label="City / Location" value={selected.city} />
                  <Detail
                    label="Preferred Contact"
                    value={selected.contactMethod}
                  />
                </div>
              </div>

              <div className="border-t border-[#EEEAE3] pt-5">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#14594c]">
                  Property & Scope
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  <Detail label="Property Type" value={selected.propertyType} />
                  <Detail
                    label="Property Size"
                    value={selected.propertySize || "Not specified"}
                  />
                  <Detail
                    label="Estimated Budget"
                    value={selected.budget}
                  />
                  <Detail
                    label="Preferred Design Style"
                    value={selected.designStyle || "Not specified"}
                  />
                  <Detail
                    label="Target Start Timeline"
                    value={selected.startDate || "Not specified"}
                  />
                </div>
              </div>

              <div className="border-t border-[#EEEAE3] pt-5">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#14594c]">
                  Selected Rooms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selected.rooms?.length ? (
                    selected.rooms.map((room) => (
                      <span
                        key={room}
                        className="rounded-full bg-[#EDF4EF] px-3 py-1 text-xs font-semibold text-[#14594c]"
                      >
                        ✓ {room}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#85877F]">
                      No individual rooms specified
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-[#EEEAE3] pt-5">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#14594c]">
                  Customer Message / Requirements
                </h3>
                <p className="whitespace-pre-wrap rounded-lg bg-[#FAF9F6] p-3 text-xs leading-6 text-[#454B47]">
                  {selected.description || "No additional description provided."}
                </p>
              </div>

              <div className="border-t border-[#EEEAE3] pt-5 flex items-center justify-between text-xs text-[#85877F]">
                <div>Submitted: {formatDate(selected.createdAt)}</div>
                <div>Last Updated: {formatDate(selected.updatedAt)}</div>
              </div>

              <div className="rounded-xl bg-[#F7F5F0] p-4">
                <label
                  htmlFor="modalStatus"
                  className="block text-xs font-bold uppercase tracking-wider text-[#173F36]"
                >
                  Change Enquiry Status
                </label>
                <div className="mt-2 flex gap-3">
                  <select
                    id="modalStatus"
                    value={selected.status}
                    disabled={updatingId === selected.id}
                    onChange={(e) =>
                      void updateStatus(
                        selected.id,
                        e.target.value as EnquiryStatus
                      )
                    }
                    className="flex-1 rounded-lg border border-[#E6E2DA] bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#14594c] disabled:opacity-50"
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => void deleteEnquiry(selected.id)}
                    className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    Delete Enquiry
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[#85877F]">{label}</p>
      <p className="mt-1 break-words font-semibold text-[#333A36]">
        {value}
      </p>
    </div>
  );
}
