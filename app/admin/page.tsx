"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface UserRecord {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
}

interface DesignerProfileRecord {
  id: number;
  userId: number;
  displayName: string;
  title: string;
  city: string;
  yearsExperience: number;
  specializations: string[];
  services: string[];
  status: string;
  rejectionReason: string | null;
  rating: string;
  createdAt: string;
  userEmail: string;
  userFullName: string;
}

interface EnquiryRecord {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  propertyType: string;
  budget: string;
  status: string;
  assignedDesignerId: number | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "designers" | "users" | "enquiries">("overview");
  const [currentUser, setCurrentUser] = useState<{ fullName: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Data states
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [designers, setDesigners] = useState<DesignerProfileRecord[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Verify admin role
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        window.location.href = "/admin/login";
        return;
      }
      const meData = await meRes.json();
      if (!meData?.user || meData.user.role !== "admin") {
        window.location.href = "/dashboard";
        return;
      }
      setCurrentUser(meData.user);

      // 2. Load users
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData.users || []);
      }

      // 3. Load designer profiles
      const desRes = await fetch("/api/admin/designers");
      if (desRes.ok) {
        const dData = await desRes.json();
        setDesigners(dData.profiles || []);
      }

      // 4. Load all enquiries
      const enqRes = await fetch("/api/enquiries");
      if (enqRes.ok) {
        const eData = await enqRes.json();
        setEnquiries(eData.enquiries || []);
      }
    } catch (err) {
      setError("Failed to load administration data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Designer profile approval / rejection
  async function updateDesignerStatus(profileId: number, status: string) {
    let rejectionReason = "";
    if (status === "rejected") {
      rejectionReason = window.prompt("Reason for rejection (sent to designer):") || "";
    }

    try {
      const res = await fetch("/api/admin/designers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, status, rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotice(data.message || `Profile status updated to ${status}.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating profile status.");
    }
  }

  // User status toggling (suspend / activate)
  async function toggleUserStatus(userId: number, currentStatus: string) {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotice(`User account ${newStatus === "active" ? "reactivated" : "suspended"}.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating user status.");
    }
  }

  // Enquiry designer assignment
  async function assignEnquiry(enquiryId: number, designerId: number | null) {
    try {
      const res = await fetch("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: enquiryId, assignedDesignerId: designerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotice(`Enquiry #${enquiryId} assigned to designer.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error assigning enquiry.");
    }
  }

  // Enquiry status change
  async function updateEnquiryStatus(enquiryId: number, status: string) {
    try {
      const res = await fetch("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: enquiryId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotice(`Enquiry #${enquiryId} status updated to ${status}.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating enquiry status.");
    }
  }

  const pendingDesigners = designers.filter((d) => d.status === "pending");
  const approvedDesigners = designers.filter((d) => d.status === "approved");

  return (
    <div className="dashboard-layout admin-layout">
      {/* Admin Sidebar Navigation */}
      <aside className="dash-sidebar">
        <div className="dash-user">
          <div className="avatar small-avatar" style={{ background: "#14594c", color: "#fff" }}>
            🛡
          </div>
          <b>{currentUser?.fullName || "Administrator"}</b>
          <small>System Admin</small>
        </div>

        <button
          onClick={() => setActiveTab("overview")}
          className={activeTab === "overview" ? "active" : ""}
          style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
        >
          <span>▦</span> Dashboard Overview
        </button>

        <button
          onClick={() => setActiveTab("designers")}
          className={activeTab === "designers" ? "active" : ""}
          style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
        >
          <span>⌂</span> Review Designers ({pendingDesigners.length})
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={activeTab === "users" ? "active" : ""}
          style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
        >
          <span>♙</span> Manage Users ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("enquiries")}
          className={activeTab === "enquiries" ? "active" : ""}
          style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
        >
          <span>✉</span> Enquiries & Leads ({enquiries.length})
        </button>

        <Link className="sidebar-bottom" href="/">
          ↩ Back to website
        </Link>
      </aside>

      {/* Admin Main Content Area */}
      <section className="dash-main">
        <div className="section-head admin-title">
          <div>
            <span className="eyebrow">SYSTEM ADMINISTRATION</span>
            <h1>Admin Control Panel</h1>
            <p>Review designer applications, assign leads, and monitor accounts.</p>
          </div>
          <button
            onClick={() => void loadData()}
            className="outline-btn btn-small"
            style={{ fontSize: "11px" }}
          >
            ↻ Refresh Data
          </button>
        </div>

        {notice && (
          <div
            role="status"
            style={{
              padding: "10px 14px",
              borderRadius: "6px",
              background: "#edf4ef",
              border: "1px solid #d9e6dc",
              color: "#14594c",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "18px",
            }}
          >
            ✓ {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              padding: "10px 14px",
              borderRadius: "6px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: "12px",
              marginBottom: "18px",
            }}
          >
            ✕ {error}
          </div>
        )}

        {/* Global Statistics Cards */}
        <div className="stat-grid">
          <div className="stat-card">
            <small>Total Users</small>
            <strong>{users.length}</strong>
            <span>Active on platform</span>
          </div>

          <div className="stat-card">
            <small>Approved Designers</small>
            <strong>{approvedDesigners.length}</strong>
            <span>Publicly searchable</span>
          </div>

          <div className="stat-card">
            <small>Pending Designer Reviews</small>
            <strong style={{ color: pendingDesigners.length > 0 ? "#b45309" : "#14594c" }}>
              {pendingDesigners.length}
            </strong>
            <span>Require approval</span>
          </div>

          <div className="stat-card">
            <small>Total Enquiries</small>
            <strong>{enquiries.length}</strong>
            <span>Customer project leads</span>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gap: "24px" }}>
            {/* Pending Approvals Quick Alert */}
            {pendingDesigners.length > 0 && (
              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fef3c7",
                  padding: "18px 22px",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <b style={{ color: "#92400e", fontSize: "14px" }}>
                    ✦ {pendingDesigners.length} Designer Profile(s) Awaiting Review
                  </b>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#b45309" }}>
                    New designers submitted their profiles and are waiting for your approval before going public.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("designers")}
                  className="btn btn-small"
                  style={{ background: "#92400e", borderColor: "#92400e" }}
                >
                  Review Profiles →
                </button>
              </div>
            )}

            {/* Recent Enquiries Preview */}
            <section className="content-panel table-panel">
              <div className="section-head">
                <div>
                  <h2>Recent Client Enquiries</h2>
                  <p>Latest customer project submissions.</p>
                </div>
                <button
                  onClick={() => setActiveTab("enquiries")}
                  className="textlink"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  Manage all ({enquiries.length}) →
                </button>
              </div>

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>City</th>
                      <th>Property</th>
                      <th>Budget</th>
                      <th>Status</th>
                      <th>Assigned Designer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.slice(0, 5).map((e) => (
                      <tr key={e.id}>
                        <td>
                          <b>{e.fullName}</b>
                          <small style={{ display: "block", color: "#85877f" }}>{e.email}</small>
                        </td>
                        <td>{e.city}</td>
                        <td>{e.propertyType}</td>
                        <td>{e.budget}</td>
                        <td>
                          <span className={`status ${e.status.toLowerCase().replace("_", "-")}`}>
                            {e.status}
                          </span>
                        </td>
                        <td>
                          {e.assignedDesignerId
                            ? users.find((u) => u.id === e.assignedDesignerId)?.fullName || `#${e.assignedDesignerId}`
                            : "Unassigned"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: DESIGNER APPROVALS */}
        {activeTab === "designers" && (
          <section className="content-panel table-panel">
            <div className="section-head">
              <div>
                <h2>Designer Profile Submissions</h2>
                <p>Review onboarding applications, verify details, and approve for public display.</p>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Display Name</th>
                    <th>Account Holder</th>
                    <th>City / Exp</th>
                    <th>Services</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {designers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#85877f" }}>
                        No designer profile submissions found yet.
                      </td>
                    </tr>
                  ) : (
                    designers.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <b>{d.displayName}</b>
                          <small style={{ display: "block", color: "#85877f" }}>{d.title}</small>
                        </td>
                        <td>
                          {d.userFullName}
                          <small style={{ display: "block", color: "#85877f" }}>{d.userEmail}</small>
                        </td>
                        <td>
                          {d.city} · {d.yearsExperience} yrs
                        </td>
                        <td>
                          <span style={{ fontSize: "11px", color: "#526158" }}>
                            {d.specializations?.slice(0, 2).join(", ") || "General"}
                          </span>
                        </td>
                        <td>
                          <span
                            className="status"
                            style={{
                              background:
                                d.status === "approved"
                                  ? "#e4f3e8"
                                  : d.status === "pending"
                                    ? "#fff1d8"
                                    : "#fee2e2",
                              color:
                                d.status === "approved"
                                  ? "#2d8050"
                                  : d.status === "pending"
                                    ? "#9a6b15"
                                    : "#991b1b",
                              fontWeight: 700,
                            }}
                          >
                            {d.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {d.status !== "approved" && (
                              <button
                                onClick={() => void updateDesignerStatus(d.id, "approved")}
                                className="btn btn-small"
                                style={{ padding: "4px 8px", fontSize: "11px", background: "#14594c" }}
                              >
                                Approve ✓
                              </button>
                            )}
                            {d.status !== "rejected" && (
                              <button
                                onClick={() => void updateDesignerStatus(d.id, "rejected")}
                                className="outline-btn"
                                style={{ padding: "4px 8px", fontSize: "11px", color: "#991b1b", borderColor: "#fca5a5" }}
                              >
                                Reject ✕
                              </button>
                            )}
                            {d.status === "approved" && (
                              <button
                                onClick={() => void updateDesignerStatus(d.id, "pending")}
                                className="outline-btn"
                                style={{ padding: "4px 8px", fontSize: "11px" }}
                              >
                                Revert
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === "users" && (
          <section className="content-panel table-panel">
            <div className="section-head">
              <div>
                <h2>User Account Management</h2>
                <p>All registered platform users. Suspend or activate accounts as necessary.</p>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Account Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontFamily: "monospace", color: "#14594c" }}>#{u.id}</td>
                      <td><b>{u.fullName}</b></td>
                      <td>{u.email}</td>
                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            background: u.role === "admin" ? "#fef3c7" : u.role === "designer" ? "#e9f0e9" : "#eff6ff",
                            color: u.role === "admin" ? "#92400e" : u.role === "designer" ? "#14594c" : "#1d4ed8",
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className="status"
                          style={{
                            background: u.status === "suspended" ? "#fee2e2" : "#e4f3e8",
                            color: u.status === "suspended" ? "#991b1b" : "#2d8050",
                          }}
                        >
                          {u.status || "active"}
                        </span>
                      </td>
                      <td>
                        {u.role !== "admin" ? (
                          <button
                            onClick={() => void toggleUserStatus(u.id, u.status)}
                            className="table-action"
                            style={{
                              color: u.status === "suspended" ? "#14594c" : "#991b1b",
                              fontWeight: 700,
                            }}
                          >
                            {u.status === "suspended" ? "Reactivate" : "Suspend"}
                          </button>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#9ca3af" }}>Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 4: ENQUIRY MANAGEMENT & DESIGNER ASSIGNMENT */}
        {activeTab === "enquiries" && (
          <section className="content-panel table-panel">
            <div className="section-head">
              <div>
                <h2>Manage & Assign Client Enquiries</h2>
                <p>Assign project leads to specific approved designers and update workflow status.</p>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Location / Budget</th>
                    <th>Property Type</th>
                    <th>Status</th>
                    <th>Assign To Designer</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontFamily: "monospace", color: "#14594c" }}>#{e.id}</td>
                      <td>
                        <b>{e.fullName}</b>
                        <small style={{ display: "block", color: "#85877f" }}>
                          {e.email} · {e.phone}
                        </small>
                      </td>
                      <td>
                        {e.city} · <b>{e.budget}</b>
                      </td>
                      <td>{e.propertyType}</td>
                      <td>
                        <select
                          value={e.status}
                          onChange={(ev) => void updateEnquiryStatus(e.id, ev.target.value)}
                          style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "4px" }}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={e.assignedDesignerId || ""}
                          onChange={(ev) =>
                            void assignEnquiry(e.id, ev.target.value ? Number(ev.target.value) : null)
                          }
                          style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "4px" }}
                        >
                          <option value="">-- Unassigned --</option>
                          {users
                            .filter((u) => u.role === "designer")
                            .map((des) => (
                              <option key={des.id} value={des.id}>
                                {des.fullName} (#{des.id})
                              </option>
                            ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
