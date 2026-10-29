
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

const users = [
  ["Riya Sharma", "Designer", "Oct 24, 2026", "Active"],
  ["Aarav Desai", "Customer", "Oct 23, 2026", "Active"],
  ["Aditya Mehta", "Designer", "Oct 22, 2026", "Pending"],
  ["Mira Shah", "Customer", "Oct 21, 2026", "Active"],
];

export default async function AdminPage() {
  // Check whether the user is logged in
  const session = await getSession();

  // Only admin can access this page
  if (!session) {
    redirect("/auth");
  }

  if (session.role !== "admin") {
    redirect(
      session.role === "designer"
        ? "/designer/dashboard"
        : "/dashboard"
    );
  }

  return (
    <div className="dashboard-layout admin-layout">
      <aside className="dash-sidebar">
        <div className="dash-user">
          <div className="avatar small-avatar">IF</div>
          <b>InteriorFinder</b>
          <small>Administrator</small>
        </div>

        <Link className="active" href="/admin">
          ▦ Dashboard
        </Link>
        <Link href="/admin/users">♙ Manage Users</Link>
        <Link href="/admin/designers">⌂ Manage Designers</Link>
        <Link href="/admin/portfolios">▤ Manage Portfolios</Link>
        <Link href="/admin/enquiries">✉ Manage Enquiries</Link>
        <Link href="/admin/settings">⚙ Settings</Link>

        <Link className="sidebar-bottom" href="/">
          ↩ Back to website
        </Link>
      </aside>

      <main className="dash-main">
        <div className="section-head admin-title">
          <div>
            <span className="eyebrow">ADMINISTRATION</span>
            <h1>Admin Dashboard</h1>
            <p>
              Monitor activity and manage InteriorFinder.
            </p>
          </div>
          <span className="admin-date">
            October 28, 2026
          </span>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <small>Total Users</small>
            <strong>156</strong>
            <span>Registered accounts</span>
          </div>

          <div className="stat-card">
            <small>Designers</small>
            <strong>24</strong>
            <span>Designer accounts</span>
          </div>

          <div className="stat-card">
            <small>Portfolios</small>
            <strong>142</strong>
            <span>Interior projects</span>
          </div>

          <div className="stat-card">
            <small>Enquiries</small>
            <strong>87</strong>
            <span>Customer enquiries</span>
          </div>
        </div>

        <section className="content-panel table-panel">
          <div className="section-head">
            <div>
              <h2>Recent Users</h2>
              <p>Recently registered accounts.</p>
            </div>
            <Link href="/admin/users" className="textlink">
              Manage users →
            </Link>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user[0]}>
                    <td>{user[0]}</td>
                    <td>{user[1]}</td>
                    <td>{user[2]}</td>
                    <td>
                      <span
                        className={`status ${user[3].toLowerCase()}`}
                      >
                        {user[3]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="admin-lower">
          <section className="content-panel">
            <h2>Recent Enquiries</h2>

            <div className="activity">
              <span className="activity-dot" />
              <div>
                <b>New project request</b>
                <small>2 BHK apartment · Pune</small>
              </div>
            </div>

            <div className="activity">
              <span className="activity-dot" />
              <div>
                <b>New enquiry received</b>
                <small>Office interior · Mumbai</small>
              </div>
            </div>
          </section>

          <section className="content-panel">
            <h2>System Activity</h2>

            <div className="activity">
              <span className="activity-icon">✓</span>
              <div>
                <b>Admin dashboard</b>
                <small>Manage platform activity here.</small>
              </div>
            </div>

            <div className="activity">
              <span className="activity-icon">＋</span>
              <div>
                <b>Designer portfolios</b>
                <small>Review project submissions.</small>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
