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
  assignedDesignerId: number | null;
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
  { value: "new", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In Progress / Consultation" },
  { value: "completed", label: "Project Completed" },
  { value: "cancelled", label: "Cancelled / Closed" },
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

function getStatusBadgeClass(status: EnquiryStatus) {
  switch (status) {
    case "new":
      return "status new";
    case "contacted":
      return "status";
    case "in_progress":
      return "status in-progress";
    case "completed":
      return "status responded";
    case "cancelled":
      return "status";
    default:
      return "status";
  }
}

export default function DesignerDashboard() {
  const [user, setUser] = useState<{ id: number; fullName: string; email: string; role: string } | null>(null);
  const [profile, setProfile] = useState<{
    id?: number;
    displayName?: string;
    title?: string;
    city?: string;
    status?: string;
    rejectionReason?: string | null;
    yearsExperience?: number;
    specializations?: string[];
  } | null>(null);

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [counts, setCounts] = useState<Counts>(emptyCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadDesignerData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Fetch designer's own profile info & approval status
      const profRes = await fetch("/api/designer/profile", { cache: "no-store" });
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData.profile || null);
      }

      // 2. Fetch enquiries assigned strictly to this designer
      const enqRes = await fetch("/api/enquiries", { cache: "no-store" });
      const enqData = await enqRes.json();

      if (!enqRes.ok) {
        throw new Error(enqData.error || "Unable to load assigned enquiries.");
      }

      setEnquiries(enqData.enquiries || []);
      setCounts(enqData.counts || emptyCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading designer workspace.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function verifyDesignerAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          window.location.href = "/login?redirect=/designer/dashboard";
          return;
        }

        const data = await res.json();
        const currentUser = data?.user;

        if (!currentUser) {
          window.location.href = "/login?redirect=/designer/dashboard";
          return;
        }

        // Strict role-based guard: Redirect non-designers to their authorized panels
        if (currentUser.role === "customer") {
          window.location.href = "/customer/dashboard";
          return;
        } else if (currentUser.role === "admin") {
          window.location.href = "/admin/dashboard";
          return;
        }

        setUser(currentUser);
        void loadDesignerData();
      } catch {
        window.location.href = "/login?redirect=/designer/dashboard";
      }
    }

    void verifyDesignerAuth();
  }, [loadDesignerData]);

  async function handleStatusUpdate(id: number, newStatus: EnquiryStatus) {
    setUpdatingId(id);
    setNotice("");

    try {
      const res = await fetch("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update enquiry status.");
      }

      setNotice(`Enquiry #${id} status updated to ${newStatus.replace("_", " ")}.`);
      if (selected?.id === id) {
        setSelected(data.enquiry);
      }
      await loadDesignerData();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to update status.");
    } finally {
      setUpdatingId(null);
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

  const profileStatus = profile?.status || "draft";

  return (
    <div className="dashboard-layout">
      {/* Designer Sidebar Navigation */}
      <aside className="dash-sidebar">
        <div className="dash-user">
          <div className="avatar small-avatar">
            {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : "D"}
          </div>
          <b>{profile?.displayName || user?.fullName || "Designer Studio"}</b>
          <small>{user?.email}</small>
          <span
            className="status in-progress"
            style={{
              marginTop: "6px",
              textTransform: "uppercase",
              fontSize: "9px",
              fontWeight: 700,
            }}
          >
            Interior Designer
          </span>
        </div>

        <Link href="/designer/dashboard" className="active">
          <span>▦</span> Designer Workspace
        </Link>

        <Link href="/designer/onboarding">
          <span>✎</span> Edit Profile & Studio
        </Link>

        <Link href="/designer/onboarding">
          <span>🖼</span> Manage Portfolio
        </Link>

        <Link className="sidebar-bottom" href="/">
          ↩ Back to Home
        </Link>
      </aside>

      {/* Main Content Area */}
      <section className="dash-main">
        {/* Welcome Header */}
        <div className="dash-welcome">
          <div>
            <span className="eyebrow" style={{ letterSpacing: "1.5px" }}>
              DESIGNER WORKSPACE
            </span>
            <h1>{profile?.displayName || "Designer Studio Dashboard"}</h1>
            <p>
              Welcome, {user?.fullName || "Designer"} · Manage assigned client projects, review customer briefs, and keep your portfolio up to date.
            </p>
          </div>

          <div className="dash-banner">
            <b>Professional Portfolio</b>
            <small>Showcase recent transformations to attract clients.</small>
            <Link href="/designer/onboarding">Edit Profile & Portfolio →</Link>
          </div>
        </div>

        {/* Profile Approval Status Alert Banner */}
        <div style={{ marginBottom: "24px" }}>
          {profileStatus === "approved" ? (
            <div
              style={{
                padding: "16px 20px",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <b style={{ color: "#065f46", fontSize: "14px" }}>✓ Profile Verified & Published</b>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#047857" }}>
                  Your designer profile is active and publicly visible to homeowners in the InteriorFinder directory.
                </p>
              </div>
              <Link href="/designers" className="outline-btn btn-small" style={{ fontSize: "11px" }}>
                View in Directory ↗
              </Link>
            </div>
          ) : profileStatus === "pending" ? (
            <div
              style={{
                padding: "16px 20px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "8px",
              }}
            >
              <b style={{ color: "#92400e", fontSize: "14px" }}>⏳ Profile Under Review</b>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#b45309" }}>
                Your designer profile and portfolio have been submitted. An administrator will review your application shortly.
              </p>
            </div>
          ) : profileStatus === "rejected" ? (
            <div
              style={{
                padding: "16px 20px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <b style={{ color: "#991b1b", fontSize: "14px" }}>⚠ Changes Requested / Application Rejected</b>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#b91c1c" }}>
                  Feedback from Administrator: {profile?.rejectionReason || "Please update your portfolio details and re-submit."}
                </p>
              </div>
              <Link href="/designer/onboarding" className="btn btn-small" style={{ fontSize: "11px", background: "#b91c1c" }}>
                Edit & Re-submit
              </Link>
            </div>
          ) : (
            <div
              style={{
                padding: "16px 20px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <b style={{ color: "#334155", fontSize: "14px" }}>✎ Profile In Draft Mode</b>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Complete your studio information, add project photos, and submit for admin approval.
                </p>
              </div>
              <Link href="/designer/onboarding" className="btn btn-small" style={{ fontSize: "11px" }}>
                Complete Profile →
              </Link>
            </div>
          )}
        </div>

        {/* Notices and Alerts */}
        {notice && (
          <div
            role="status"
            style={{
              padding: "12px 16px",
              background: "#edf4ef",
              border: "1px solid #c7ddce",
              borderRadius: "6px",
              color: "var(--deep)",
              marginBottom: "20px",
              fontSize: "12px",
            }}
          >
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              padding: "12px 16px",
              background: "#fee2e2",
              border: "1px solid #f87171",
              borderRadius: "6px",
              color: "#991b1b",
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => void loadDesignerData()}
              style={{
                background: "none",
                border: "none",
                fontWeight: 700,
                color: "#991b1b",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="stat-grid">
          <div className="stat-card">
            <small>Assigned Enquiries</small>
            <strong>{loading ? "—" : counts.total}</strong>
            <span>Direct client leads</span>
          </div>

          <div className="stat-card">
            <small>New Inquiries</small>
            <strong style={{ color: "#b88636" }}>{loading ? "—" : counts.new}</strong>
            <span>Needs initial response</span>
          </div>

          <div className="stat-card">
            <small>In Consultation</small>
            <strong style={{ color: "#4069a7" }}>{loading ? "—" : counts.in_progress + counts.contacted}</strong>
            <span>Active client discussions</span>
          </div>

          <div className="stat-card">
            <small>Completed Finalized</small>
            <strong style={{ color: "var(--green)" }}>{loading ? "—" : counts.completed}</strong>
            <span>Finished projects</span>
          </div>
        </div>

        {/* Assigned Enquiries Panel */}
        <div className="content-panel table-panel">
          <div
            className="section-head"
            style={{
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: "20px" }}>
                Enquiries Assigned to You
              </h2>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--muted)" }}>
                Showing {filteredEnquiries.length} of {counts.total} leads
              </p>
            </div>

            {/* Filter and Action Strip */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search client, city, property..."
                style={{
                  padding: "8px 12px",
                  fontSize: "12px",
                  border: "1px solid var(--line)",
                  borderRadius: "5px",
                  width: "220px",
                }}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  fontSize: "12px",
                  border: "1px solid var(--line)",
                  borderRadius: "5px",
                  background: "#fff",
                }}
              >
                <option value="all">All statuses ({counts.total})</option>
                <option value="new">New ({counts.new})</option>
                <option value="contacted">Contacted ({counts.contacted})</option>
                <option value="in_progress">In Progress ({counts.in_progress})</option>
                <option value="completed">Completed ({counts.completed})</option>
                <option value="cancelled">Cancelled ({counts.cancelled})</option>
              </select>

              <button
                onClick={() => void loadDesignerData()}
                disabled={loading}
                className="outline-btn btn-small"
                style={{ fontSize: "11px" }}
              >
                {loading ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>
          </div>

          {/* Table or Empty State */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)", fontSize: "12px" }}>
              Loading assigned client leads...
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "#fbfcf9",
                borderRadius: "6px",
                border: "1px dashed var(--line)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "var(--mint)",
                  color: "var(--green)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "22px",
                  margin: "0 auto 14px",
                }}
              >
                📋
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: "17px", color: "var(--deep)" }}>
                {enquiries.length === 0 ? "No customer leads assigned yet" : "No leads match this filter"}
              </h3>
              <p
                style={{
                  margin: "0 auto 18px",
                  maxWidth: "460px",
                  fontSize: "12px",
                  color: "var(--muted)",
                  lineHeight: 1.6,
                }}
              >
                {enquiries.length === 0
                  ? "When homeowners request consultations with your studio or an administrator assigns client leads to you, they will appear right here."
                  : "Try clearing your search query or switching the status filter."}
              </p>
              {profileStatus !== "approved" && (
                <Link href="/designer/onboarding" className="btn btn-small" style={{ margin: "0 auto" }}>
                  Ensure Profile is Approved →
                </Link>
              )}
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer Contact</th>
                    <th>Property Type</th>
                    <th>City</th>
                    <th>Budget</th>
                    <th>Status</th>
                    <th>Update Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnquiries.map((enquiry) => (
                    <tr key={enquiry.id}>
                      <td style={{ fontWeight: 700, color: "var(--green)" }}>
                        #{enquiry.id}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <b style={{ color: "var(--deep)" }}>{enquiry.fullName}</b>
                          <small style={{ color: "var(--muted)" }}>
                            {enquiry.email} · {enquiry.phone}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span>{enquiry.propertyType}</span>
                          <small style={{ color: "var(--muted)" }}>
                            {enquiry.propertySize || "Size not specified"}
                            {enquiry.designStyle ? ` · ${enquiry.designStyle}` : ""}
                          </small>
                        </div>
                      </td>
                      <td>{enquiry.city}</td>
                      <td style={{ fontWeight: 700, color: "var(--deep)" }}>
                        {enquiry.budget}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(enquiry.status)}>
                          {enquiry.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <select
                          value={enquiry.status}
                          disabled={updatingId === enquiry.id}
                          onChange={(e) =>
                            void handleStatusUpdate(
                              enquiry.id,
                              e.target.value as EnquiryStatus
                            )
                          }
                          style={{
                            padding: "4px 8px",
                            fontSize: "11px",
                            borderRadius: "4px",
                            border: "1px solid var(--line)",
                            background: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          {statusOptions.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelected(enquiry)}
                          className="table-action"
                          style={{ cursor: "pointer" }}
                        >
                          View Brief
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Customer Enquiry Detail Modal */}
        {selected && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(12, 45, 34, 0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                maxWidth: "600px",
                width: "100%",
                padding: "28px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--line)",
                  paddingBottom: "14px",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <span className="eyebrow" style={{ marginBottom: "4px" }}>
                    CLIENT DESIGN BRIEF
                  </span>
                  <h3 style={{ margin: 0, fontSize: "20px", color: "var(--deep)" }}>
                    #{selected.id} · {selected.propertyType} in {selected.city}
                  </h3>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: "var(--muted)",
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "12px", marginBottom: "20px" }}>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Customer Name</small>
                  <b>{selected.fullName}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Email</small>
                  <b>{selected.email}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Phone</small>
                  <b>{selected.phone}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Budget</small>
                  <b style={{ color: "var(--green)" }}>{selected.budget}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Property Size</small>
                  <b>{selected.propertySize || "Not specified"}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Preferred Style</small>
                  <b>{selected.designStyle || "Flexible"}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Preferred Contact</small>
                  <b>{selected.contactMethod}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Submitted Date</small>
                  <b>{formatDate(selected.createdAt)}</b>
                </div>
              </div>

              {selected.rooms && selected.rooms.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <small style={{ color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                    Required Rooms & Areas:
                  </small>
                  <div className="tag-list">
                    {selected.rooms.map((room) => (
                      <span key={room}>{room}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.description && (
                <div style={{ marginBottom: "20px" }}>
                  <small style={{ color: "var(--muted)", display: "block", marginBottom: "4px" }}>
                    Customer Requirements & Vision:
                  </small>
                  <p
                    style={{
                      background: "#f8faf7",
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1px solid var(--line)",
                      fontSize: "12px",
                      lineHeight: 1.6,
                      color: "var(--ink)",
                      margin: 0,
                    }}
                  >
                    {selected.description}
                  </p>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid var(--line)",
                  paddingTop: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>Status:</span>
                  <select
                    value={selected.status}
                    onChange={(e) => void handleStatusUpdate(selected.id, e.target.value as EnquiryStatus)}
                    style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--line)" }}
                  >
                    {statusOptions.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="btn btn-small btn-light"
                  style={{ border: "1px solid var(--line)" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}