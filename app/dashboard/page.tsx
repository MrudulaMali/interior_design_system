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
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
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
  const [userRole, setUserRole] = useState("customer");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [designerTab, setDesignerTab] = useState<"all" | "assigned" | "open">("all");

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
      if (data.role) {
        setUserRole(data.role);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          window.location.href = "/login?redirect=/dashboard";
          return;
        }
        const data = await res.json();
        if (data?.user) {
          setUserRole(data.user.role);
          setCurrentUserId(data.user.id);
          setUserName(data.user.fullName);
          setUserEmail(data.user.email);
        }
      } catch {
        window.location.href = "/login?redirect=/dashboard";
        return;
      }
      void loadDashboard();
    }
    void verifyAuth();
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

  async function claimLead(id: number) {
    setUpdatingId(id);
    setNotice("");

    try {
      const response = await fetch("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "claim" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim customer lead.");
      }

      setNotice(`Successfully claimed Enquiry #${id}! It is now in your active client list.`);
      await loadDashboard();
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Unable to claim lead."
      );
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

    let matchesTab = true;
    if (userRole === "designer") {
      if (designerTab === "assigned") {
        matchesTab = enquiry.assignedDesignerId === currentUserId;
      } else if (designerTab === "open") {
        matchesTab = enquiry.assignedDesignerId === null;
      }
    }

    return matchesSearch && matchesStatus && matchesTab;
  });

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="dash-sidebar">
        <div className="dash-user">
          <div className="avatar small-avatar">
            {userName
              ? userName.charAt(0).toUpperCase()
              : userRole === "designer"
                ? "D"
                : "C"}
          </div>
          <b>{userName || (userRole === "designer" ? "Designer" : "Customer")}</b>
          <small>{userEmail || "Signed in"}</small>
          <span
            className={
              userRole === "admin"
                ? "status responded"
                : userRole === "designer"
                  ? "status in-progress"
                  : "status"
            }
            style={{
              marginTop: "6px",
              textTransform: "uppercase",
              fontSize: "9px",
              fontWeight: 700,
            }}
          >
            {userRole}
          </span>
        </div>

        <Link href="/dashboard" className="active">
          <span>▦</span> {userRole === "designer" ? "Designer Leads" : "My Enquiries"}
        </Link>

        {userRole === "customer" && (
          <Link href="/designers">
            <span>⌖</span> Browse Designers
          </Link>
        )}

        {userRole === "customer" && (
          <Link href="/portfolio">
            <span>🖼</span> Portfolio Gallery
          </Link>
        )}

        {userRole === "designer" && (
          <Link href="/designer/onboarding">
            <span>✎</span> Edit Profile & Work
          </Link>
        )}

        {userRole === "admin" && (
          <Link href="/admin">
            <span>🛡</span> Admin Control Panel
          </Link>
        )}

        <Link href="/enquiry">
          <span>✉</span> Submit New Enquiry
        </Link>

        <Link href="/choose-journey">
          <span>⇄</span> Switch Journey
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
            <span className="eyebrow">
              {userRole === "designer"
                ? "DESIGNER WORKSPACE"
                : userRole === "admin"
                  ? "ADMINISTRATOR OVERVIEW"
                  : "CUSTOMER PORTAL"}
            </span>
            <h1>
              {userRole === "designer"
                ? "Assigned Client Enquiries"
                : userRole === "admin"
                  ? "All Platform Enquiries"
                  : "My Project Enquiries"}
            </h1>
            <p>
              Welcome, {userName || "Homeowner"} ·{" "}
              {userRole === "designer"
                ? "Manage client design briefs, consult leads, and update project status."
                : "Track your interior design consultations, budget estimates, and progress."}
            </p>
          </div>

          <div className="dash-banner">
            <b>{userRole === "designer" ? "Showcase your portfolio" : "Ready for a consultation?"}</b>
            <small>
              {userRole === "designer"
                ? "Keep your projects updated to attract clients."
                : "Explore verified designers matching your budget."}
            </small>
            <Link href={userRole === "designer" ? "/designer/onboarding" : "/designers"}>
              {userRole === "designer" ? "Update Profile →" : "Find Designers →"}
            </Link>
          </div>
        </div>

        {/* Notifications & Error Alerts */}
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
              onClick={() => void loadDashboard()}
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

        {/* 4 Stat Cards */}
        <div className="stat-grid">
          <div className="stat-card">
            <small>Total Enquiries</small>
            <strong>{loading ? "—" : counts.total}</strong>
            <span>All recorded requests</span>
          </div>

          <div className="stat-card">
            <small>New Enquiries</small>
            <strong style={{ color: "#b88636" }}>
              {loading ? "—" : counts.new}
            </strong>
            <span>Awaiting first response</span>
          </div>

          <div className="stat-card">
            <small>In Consultation</small>
            <strong style={{ color: "#4069a7" }}>
              {loading ? "—" : counts.in_progress}
            </strong>
            <span>Active project discussions</span>
          </div>

          <div className="stat-card">
            <small>Completed</small>
            <strong style={{ color: "var(--green)" }}>
              {loading ? "—" : counts.completed}
            </strong>
            <span>Successfully finalized</span>
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
                {userRole === "designer" ? "Client Leads & Requests" : "Your Consultation Requests"}
              </h2>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--muted)" }}>
                Showing {filteredEnquiries.length} of {counts.total} enquiries
              </p>
            </div>

            {/* Designer Lead Board Selector */}
            {userRole === "designer" && (
              <div style={{ display: "flex", gap: "6px", width: "100%", margin: "8px 0" }}>
                <button
                  type="button"
                  onClick={() => setDesignerTab("all")}
                  className={designerTab === "all" ? "btn btn-small" : "outline-btn btn-small"}
                  style={{ fontSize: "11px" }}
                >
                  All Leads ({enquiries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDesignerTab("assigned")}
                  className={designerTab === "assigned" ? "btn btn-small" : "outline-btn btn-small"}
                  style={{ fontSize: "11px" }}
                >
                  My Active Clients ({enquiries.filter((e) => e.assignedDesignerId === currentUserId).length})
                </button>
                <button
                  type="button"
                  onClick={() => setDesignerTab("open")}
                  className={designerTab === "open" ? "btn btn-small" : "outline-btn btn-small"}
                  style={{ fontSize: "11px", borderColor: "var(--green)" }}
                >
                  🎯 Find Customers / Open Board ({enquiries.filter((e) => e.assignedDesignerId === null).length})
                </button>
              </div>
            )}

            {/* Filter and Action Strip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, city, style..."
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
                {statusOptions.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label} ({counts[st.value]})
                  </option>
                ))}
              </select>

              <button
                onClick={() => void loadDashboard()}
                disabled={loading}
                className="outline-btn btn-small"
                style={{ fontSize: "11px" }}
              >
                {loading ? "Refreshing..." : "↻ Refresh"}
              </button>

              <Link
                href="/enquiry"
                className="btn btn-small"
                style={{ fontSize: "11px" }}
              >
                + New Enquiry
              </Link>
            </div>
          </div>

          {/* Table or Empty State */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)", fontSize: "12px" }}>
              Loading enquiries from PostgreSQL database...
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
                {enquiries.length === 0
                  ? "No enquiries recorded yet"
                  : "No enquiries match your search or filter"}
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
                  ? userRole === "designer"
                    ? "When clients submit design enquiries specifying your profile or assigned by admin, they will appear right here."
                    : "Ready to redesign your home, villa, or office? Submit your first enquiry to get matched with top interior designers."
                  : "Try clearing your search query or selecting 'All statuses' from the filter dropdown."}
              </p>
              {enquiries.length === 0 && (
                <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                  {userRole === "customer" && (
                    <Link href="/enquiry" className="btn btn-small">
                      + Submit Your First Enquiry
                    </Link>
                  )}
                  <Link href="/designers" className="outline-btn btn-small">
                    Explore Verified Designers →
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
                    <th>Customer</th>
                    <th>Property</th>
                    <th>Location</th>
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

                          {userRole === "designer" && enquiry.assignedDesignerId === null && (
                            <button
                              onClick={() => void claimLead(enquiry.id)}
                              disabled={updatingId === enquiry.id}
                              className="btn btn-small"
                              style={{
                                fontSize: "10px",
                                padding: "4px 9px",
                                background: "var(--green)",
                                color: "#fff",
                                border: "none",
                              }}
                            >
                              {updatingId === enquiry.id ? "Claiming..." : "+ Accept Lead"}
                            </button>
                          )}

                          {(userRole === "admin" || (userRole === "designer" && enquiry.assignedDesignerId === currentUserId)) && (
                            <select
                              value={enquiry.status}
                              disabled={updatingId === enquiry.id}
                              onChange={(e) =>
                                void updateStatus(
                                  enquiry.id,
                                  e.target.value as EnquiryStatus
                                )
                              }
                              style={{
                                padding: "4px 8px",
                                fontSize: "10px",
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
                          )}

                          {userRole === "admin" && (
                            <button
                              onClick={() => void deleteEnquiry(enquiry.id)}
                              disabled={deletingId === enquiry.id}
                              style={{
                                color: "#dc2626",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                fontSize: "11px",
                                fontWeight: 700,
                              }}
                            >
                              {deletingId === enquiry.id ? "..." : "Delete"}
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
                  <small style={{ color: "var(--muted)", display: "block" }}>Customer Name</small>
                  <b>{selected.fullName}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Contact Email</small>
                  <b>{selected.email}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Phone Number</small>
                  <b>{selected.phone}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Budget Range</small>
                  <b style={{ color: "var(--green)" }}>{selected.budget}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Property Size</small>
                  <b>{selected.propertySize || "Not specified"}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Design Style</small>
                  <b>{selected.designStyle || "Flexible"}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Preferred Contact</small>
                  <b>{selected.contactMethod}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Current Status</small>
                  <span className={getStatusBadgeClass(selected.status)}>
                    {selected.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {selected.rooms && selected.rooms.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <small style={{ color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                    Rooms / Spaces to Design:
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
                    Customer Requirements & Notes:
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
                  justifyContent: "flex-end",
                  gap: "10px",
                  borderTop: "1px solid var(--line)",
                  paddingTop: "16px",
                }}
              >
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