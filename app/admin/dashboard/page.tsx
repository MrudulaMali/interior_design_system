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
        if (meData?.user?.role === "designer") {
          window.location.href = "/designer/dashboard";
        } else {
          window.location.href = "/customer/dashboard";
        }
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
    } catch {
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
      rejectionReason = window.prompt("Reason for rejection (feedback to designer):") || "";
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

      setNotice(`Enquiry #${enquiryId} assigned successfully.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error assigning enquiry.");
    }
  }

  const pendingDesigners = designers.filter((d) => d.status === "pending");
  const approvedDesigners = designers.filter((d) => d.status === "approved");
  const customerCount = users.filter((u) => u.role === "customer").length;
  const designerCount = users.filter((u) => u.role === "designer").length;

  return (
    <div className="dashboard-layout">
      {/* Admin Sidebar Navigation */}
      <aside className="dash-sidebar">
        <div className="dash-user">
          <div className="avatar small-avatar">
            {currentUser?.fullName?.charAt(0) || "A"}
          </div>
          <b>{currentUser?.fullName || "Administrator"}</b>
          <small>{currentUser?.email}</small>
          <span
            className="status responded"
            style={{
              marginTop: "6px",
              textTransform: "uppercase",
              fontSize: "9px",
              fontWeight: 700,
            }}
          >
            System Admin
          </span>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={activeTab === "overview" ? "active" : ""}
          style={{
            background: "none",
            border: "none",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span>▦</span> Dashboard Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("designers")}
          className={activeTab === "designers" ? "active" : ""}
          style={{
            background: "none",
            border: "none",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span>⌂</span> Review Designers ({pendingDesigners.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("enquiries")}
          className={activeTab === "enquiries" ? "active" : ""}
          style={{
            background: "none",
            border: "none",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span>✉</span> Manage Enquiries ({enquiries.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={activeTab === "users" ? "active" : ""}
          style={{
            background: "none",
            border: "none",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span>👥</span> Manage Users ({users.length})
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
            <p>Review designer profile submissions, assign client leads, and manage user accounts.</p>
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
              color: "var(--deep)",
              border: "1px solid #c7ddce",
              marginBottom: "18px",
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
              padding: "10px 14px",
              borderRadius: "6px",
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              marginBottom: "18px",
              fontSize: "12px",
            }}
          >
            {error}
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div>
            <div className="stat-grid">
              <div className="stat-card">
                <small>Pending Designer Reviews</small>
                <strong style={{ color: pendingDesigners.length > 0 ? "#b88636" : "var(--deep)" }}>
                  {loading ? "—" : pendingDesigners.length}
                </strong>
                <span>Awaiting admin review</span>
              </div>

              <div className="stat-card">
                <small>Approved Designers</small>
                <strong>{loading ? "—" : approvedDesigners.length}</strong>
                <span>Active on public directory</span>
              </div>

              <div className="stat-card">
                <small>Total Customer Enquiries</small>
                <strong>{loading ? "—" : enquiries.length}</strong>
                <span>Platform client briefs</span>
              </div>

              <div className="stat-card">
                <small>Registered Accounts</small>
                <strong>{loading ? "—" : users.length}</strong>
                <span>{customerCount} clients · {designerCount} designers</span>
              </div>
            </div>

            {/* Quick Actions / Pending Alerts */}
            {pendingDesigners.length > 0 && (
              <div
                className="content-panel"
                style={{
                  padding: "20px",
                  background: "#fffbeb",
                  borderColor: "#fde68a",
                  marginBottom: "24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#92400e" }}>
                      ⚡ Action Required: {pendingDesigners.length} Designer Application(s) Pending
                    </h3>
                    <p style={{ margin: 0, fontSize: "12px", color: "#b45309" }}>
                      New interior designers have submitted profiles and are waiting for review before going public.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("designers")}
                    className="btn btn-small"
                    style={{ fontSize: "11px", background: "#b45309" }}
                  >
                    Review Applications →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DESIGNER APPROVALS */}
        {activeTab === "designers" && (
          <div className="content-panel table-panel">
            <div className="section-head">
              <div>
                <h2>Designer Applications & Profiles</h2>
                <p>Review studio credentials, portfolio photos, and grant directory publishing approval.</p>
              </div>
            </div>

            {designers.length === 0 ? (
              <p style={{ color: "var(--muted)", padding: "20px" }}>No designer profiles registered yet.</p>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Studio Name</th>
                      <th>Designer / User</th>
                      <th>Location</th>
                      <th>Experience</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {designers.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <b>{d.displayName}</b>
                          <small style={{ display: "block", color: "var(--muted)" }}>{d.title}</small>
                        </td>
                        <td>
                          <div>{d.userFullName}</div>
                          <small style={{ color: "var(--muted)" }}>{d.userEmail}</small>
                        </td>
                        <td>{d.city}</td>
                        <td>{d.yearsExperience} yrs</td>
                        <td>
                          <span
                            className={
                              d.status === "approved"
                                ? "status responded"
                                : d.status === "pending"
                                  ? "status new"
                                  : "status"
                            }
                          >
                            {d.status.toUpperCase()}
                          </span>
                        </td>
                        <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {d.status !== "approved" && (
                              <button
                                onClick={() => void updateDesignerStatus(d.id, "approved")}
                                className="btn btn-small"
                                style={{ fontSize: "10px", padding: "4px 8px" }}
                              >
                                Approve
                              </button>
                            )}
                            {d.status !== "rejected" && (
                              <button
                                onClick={() => void updateDesignerStatus(d.id, "rejected")}
                                className="outline-btn btn-small"
                                style={{ fontSize: "10px", padding: "4px 8px", color: "#b91c1c", borderColor: "#fca5a5" }}
                              >
                                Reject
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
        )}

        {/* TAB 3: ENQUIRIES & LEAD ASSIGNMENT */}
        {activeTab === "enquiries" && (
          <div className="content-panel table-panel">
            <div className="section-head">
              <div>
                <h2>Customer Enquiries & Designer Assignments</h2>
                <p>Assign customer consultation enquiries directly to approved interior designers.</p>
              </div>
            </div>

            {enquiries.length === 0 ? (
              <p style={{ color: "var(--muted)", padding: "20px" }}>No enquiries recorded yet.</p>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer Details</th>
                      <th>Property & City</th>
                      <th>Budget</th>
                      <th>Status</th>
                      <th>Assigned Designer</th>
                      <th>Assign Designer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map((e) => (
                      <tr key={e.id}>
                        <td><b>#{e.id}</b></td>
                        <td>
                          <div><b>{e.fullName}</b></div>
                          <small style={{ color: "var(--muted)" }}>{e.email} · {e.phone}</small>
                        </td>
                        <td>{e.propertyType} in {e.city}</td>
                        <td><b>{e.budget}</b></td>
                        <td>
                          <span className="status">{e.status.toUpperCase()}</span>
                        </td>
                        <td>
                          {e.assignedDesignerId ? (
                            <span style={{ fontWeight: 600, color: "var(--green)" }}>
                              {users.find((u) => u.id === e.assignedDesignerId)?.fullName || `Designer #${e.assignedDesignerId}`}
                            </span>
                          ) : (
                            <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Unassigned</span>
                          )}
                        </td>
                        <td>
                          <select
                            value={e.assignedDesignerId || ""}
                            onChange={(evt) => {
                              const val = evt.target.value;
                              void assignEnquiry(e.id, val ? Number(val) : null);
                            }}
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                          >
                            <option value="">— Unassigned —</option>
                            {approvedDesigners.map((ad) => (
                              <option key={ad.userId} value={ad.userId}>
                                {ad.displayName} ({ad.userFullName})
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: USERS MANAGEMENT */}
        {activeTab === "users" && (
          <div className="content-panel table-panel">
            <div className="section-head">
              <div>
                <h2>Platform User Accounts</h2>
                <p>Inspect customer and designer accounts, and suspend or reactivate access.</p>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Account Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td><b>{u.fullName}</b></td>
                      <td>{u.email}</td>
                      <td>{u.phone || "—"}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            textTransform: "uppercase",
                            fontSize: "10px",
                            color: u.role === "admin" ? "#92400e" : u.role === "designer" ? "var(--green)" : "#1d4ed8",
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={u.status === "active" ? "status responded" : "status"}>
                          {u.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {u.role !== "admin" && (
                          <button
                            onClick={() => void toggleUserStatus(u.id, u.status)}
                            className="outline-btn btn-small"
                            style={{
                              fontSize: "10px",
                              padding: "4px 8px",
                              color: u.status === "active" ? "#b91c1c" : "var(--green)",
                              borderColor: u.status === "active" ? "#fca5a5" : "#a7f3d0",
                            }}
                          >
                            {u.status === "active" ? "Suspend" : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}