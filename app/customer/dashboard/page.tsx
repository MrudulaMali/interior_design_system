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

export default function CustomerDashboard() {
  const [user, setUser] = useState<{ id: number; fullName: string; email: string; phone?: string; role: string } | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [counts, setCounts] = useState<Counts>(emptyCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Profile Edit modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const loadCustomerData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/enquiries", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load customer enquiries.");
      }

      setEnquiries(data.enquiries || []);
      setCounts(data.counts || emptyCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load enquiries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function verifyCustomerAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          window.location.href = "/login?redirect=/customer/dashboard";
          return;
        }

        const data = await res.json();
        const currentUser = data?.user;

        if (!currentUser) {
          window.location.href = "/login?redirect=/customer/dashboard";
          return;
        }

        // Strict role-based guard: Redirect non-customers to their authorized panels
        if (currentUser.role === "designer") {
          window.location.href = "/designer/dashboard";
          return;
        } else if (currentUser.role === "admin") {
          window.location.href = "/admin/dashboard";
          return;
        }

        setUser(currentUser);
        setEditFullName(currentUser.fullName || "");
        setEditPhone(currentUser.phone || "");
        void loadCustomerData();
      } catch {
        window.location.href = "/login?redirect=/customer/dashboard";
      }
    }

    void verifyCustomerAuth();
  }, [loadCustomerData]);

  // Cancel an enquiry (permitted only if status is 'new' or 'contacted')
  async function handleCancelEnquiry(id: number) {
    if (!window.confirm(`Are you sure you want to cancel enquiry #${id}?`)) {
      return;
    }

    setCancellingId(id);
    setNotice("");

    try {
      const res = await fetch("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "cancelled" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel enquiry.");
      }

      setNotice(`Enquiry #${id} has been cancelled successfully.`);
      if (selected?.id === id) {
        setSelected(null);
      }
      await loadCustomerData();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to cancel enquiry.");
    } finally {
      setCancellingId(null);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setNotice("");

    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: editFullName, phone: editPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setUser((prev) => (prev ? { ...prev, fullName: editFullName, phone: editPhone } : null));
      setNotice("Profile updated successfully.");
      setShowProfileModal(false);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setSavingProfile(false);
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
    <div className="dashboard-layout">
      {/* Customer Sidebar Navigation */}
      <aside className="dash-sidebar">
        <div className="dash-user">
          <div className="avatar small-avatar">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "C"}
          </div>
          <b>{user?.fullName || "Valued Client"}</b>
          <small>{user?.email}</small>
          <span
            className="status responded"
            style={{
              marginTop: "6px",
              textTransform: "uppercase",
              fontSize: "9px",
              fontWeight: 700,
            }}
          >
            Customer
          </span>
        </div>

        <Link href="/customer/dashboard" className="active">
          <span>▦</span> Customer Dashboard
        </Link>

        <Link href="/designers">
          <span>⌖</span> Find Designers
        </Link>

        <Link href="/portfolio">
          <span>🖼</span> Design Inspiration
        </Link>

        <Link href="/enquiry">
          <span>✉</span> Submit New Enquiry
        </Link>

        <button
          onClick={() => setShowProfileModal(true)}
          className="outline-btn btn-small"
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#d5e2d9",
            margin: "12px 0 0",
            justifyContent: "flex-start",
            gap: "8px",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          <span>👤</span> Edit My Profile
        </button>

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
              CUSTOMER PORTAL
            </span>
            <h1>My Project Enquiries</h1>
            <p>
              Welcome, {user?.fullName || "Homeowner"} · Track your design consultations, quotes, and assigned designers.
            </p>
          </div>

          <div className="dash-banner">
            <b>Ready to redesign your space?</b>
            <small>Browse verified designers across top cities.</small>
            <Link href="/designers">Find Designers →</Link>
          </div>
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
              onClick={() => void loadCustomerData()}
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

        {/* Stat Cards */}
        <div className="stat-grid">
          <div className="stat-card">
            <small>My Total Enquiries</small>
            <strong>{loading ? "—" : counts.total}</strong>
            <span>Submitted requests</span>
          </div>

          <div className="stat-card">
            <small>Awaiting Response</small>
            <strong style={{ color: "#b88636" }}>{loading ? "—" : counts.new}</strong>
            <span>Under review</span>
          </div>

          <div className="stat-card">
            <small>Active Consultation</small>
            <strong style={{ color: "#4069a7" }}>{loading ? "—" : counts.in_progress + counts.contacted}</strong>
            <span>Designer in touch</span>
          </div>

          <div className="stat-card">
            <small>Completed Projects</small>
            <strong style={{ color: "var(--green)" }}>{loading ? "—" : counts.completed}</strong>
            <span>Finalized designs</span>
          </div>
        </div>

        {/* Enquiries Section Panel */}
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
                My Submitted Requests
              </h2>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--muted)" }}>
                Showing {filteredEnquiries.length} of {counts.total} enquiries
              </p>
            </div>

            {/* Filter and Action Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city, property, style..."
                style={{
                  padding: "8px 12px",
                  fontSize: "12px",
                  border: "1px solid var(--line)",
                  borderRadius: "5px",
                  width: "210px",
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
                onClick={() => void loadCustomerData()}
                disabled={loading}
                className="outline-btn btn-small"
                style={{ fontSize: "11px" }}
              >
                {loading ? "Refreshing..." : "↻ Refresh"}
              </button>

              <Link href="/enquiry" className="btn btn-small" style={{ fontSize: "11px" }}>
                + Submit Enquiry
              </Link>
            </div>
          </div>

          {/* Table or Empty State */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)", fontSize: "12px" }}>
              Loading your enquiries...
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
                ✉
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: "17px", color: "var(--deep)" }}>
                {enquiries.length === 0 ? "You haven't submitted any enquiries yet" : "No enquiries match this filter"}
              </h3>
              <p
                style={{
                  margin: "0 auto 18px",
                  maxWidth: "420px",
                  fontSize: "12px",
                  color: "var(--muted)",
                  lineHeight: 1.6,
                }}
              >
                {enquiries.length === 0
                  ? "Looking to design your living room, kitchen, or complete apartment? Submit your first enquiry to get connected with verified interior designers."
                  : "Try clearing your search query or switching the status filter."}
              </p>
              {enquiries.length === 0 && (
                <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                  <Link href="/enquiry" className="btn btn-small">
                    + Submit Your First Enquiry
                  </Link>
                  <Link href="/designers" className="outline-btn btn-small">
                    Browse Verified Designers →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Property Type</th>
                    <th>City</th>
                    <th>Design Style</th>
                    <th>Budget</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
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
                          <b style={{ color: "var(--deep)" }}>{enquiry.propertyType}</b>
                          <small style={{ color: "var(--muted)" }}>
                            {enquiry.propertySize || "Size not specified"}
                          </small>
                        </div>
                      </td>
                      <td>{enquiry.city}</td>
                      <td>{enquiry.designStyle || "Flexible"}</td>
                      <td style={{ fontWeight: 700, color: "var(--deep)" }}>
                        {enquiry.budget}
                      </td>
                      <td style={{ color: "var(--muted)" }}>
                        {formatDate(enquiry.createdAt)}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(enquiry.status)}>
                          {enquiry.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button
                            onClick={() => setSelected(enquiry)}
                            className="table-action"
                            style={{ cursor: "pointer" }}
                          >
                            View
                          </button>

                          {(enquiry.status === "new" || enquiry.status === "contacted") && (
                            <button
                              onClick={() => void handleCancelEnquiry(enquiry.id)}
                              disabled={cancellingId === enquiry.id}
                              style={{
                                color: "#b91c1c",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                fontSize: "11px",
                                fontWeight: 600,
                              }}
                            >
                              {cancellingId === enquiry.id ? "..." : "Cancel"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Enquiry Detail Modal */}
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
                    ENQUIRY DETAILS
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
                  <small style={{ color: "var(--muted)", display: "block" }}>Property Type</small>
                  <b>{selected.propertyType}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Property Size</small>
                  <b>{selected.propertySize || "Not specified"}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Location</small>
                  <b>{selected.city}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Budget Range</small>
                  <b style={{ color: "var(--green)" }}>{selected.budget}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Preferred Style</small>
                  <b>{selected.designStyle || "Flexible"}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Contact Method</small>
                  <b>{selected.contactMethod}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Submitted On</small>
                  <b>{formatDate(selected.createdAt)}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Status</small>
                  <span className={getStatusBadgeClass(selected.status)}>
                    {selected.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {selected.rooms && selected.rooms.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <small style={{ color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                    Selected Rooms / Spaces:
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
                    Your Notes / Specifications:
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
                {(selected.status === "new" || selected.status === "contacted") && (
                  <button
                    onClick={() => void handleCancelEnquiry(selected.id)}
                    className="outline-btn btn-small"
                    style={{ color: "#b91c1c", borderColor: "#fecaca" }}
                  >
                    Cancel This Enquiry
                  </button>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="btn btn-small btn-light"
                  style={{ border: "1px solid var(--line)", marginLeft: "auto" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Edit Modal */}
        {showProfileModal && (
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
            <form
              onSubmit={handleSaveProfile}
              style={{
                background: "#fff",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                maxWidth: "480px",
                width: "100%",
                padding: "28px",
                boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
              }}
            >
              <h3 style={{ margin: "0 0 16px", fontSize: "20px", color: "var(--deep)" }}>
                Edit Customer Profile
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
                  Full Name
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                    style={{ width: "100%", marginTop: "4px" }}
                  />
                </label>

                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
                  Phone Number
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{ width: "100%", marginTop: "4px" }}
                  />
                </label>

                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Email Address</small>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--ink)" }}>{user?.email} (Account ID)</p>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="outline-btn btn-small"
                  disabled={savingProfile}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-small" disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}