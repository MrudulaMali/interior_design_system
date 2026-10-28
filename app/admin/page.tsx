import Link from "next/link";
const users = [
  ["Riya Sharma", "Designer", "Oct 24, 2026", "Active"],
  ["Aarav Desai", "Customer", "Oct 23, 2026", "Active"],
  ["Aditya Mehta", "Designer", "Oct 22, 2026", "Pending"],
  ["Mira Shah", "Customer", "Oct 21, 2026", "Active"],
];
export default function Admin() {
  return (
    <div className="dashboard-layout admin-layout">
      <aside className="dash-sidebar">
        <div className="dash-user">
          <div className="avatar small-avatar">IF</div>
          <b>InteriorFinder</b>
          <small>Administrator</small>
        </div>
        {[
          ["▦", "Dashboard"],
          ["♙", "Manage Users"],
          ["⌂", "Manage Designers"],
          ["▤", "Manage Portfolios"],
          ["✉", "Manage Enquiries"],
          ["⚙", "Settings"],
        ].map((x, i) => (
          <Link className={i === 0 ? "active" : ""} href="/admin" key={x[1]}>
            <span>{x[0]}</span>
            {x[1]}
          </Link>
        ))}
        <Link className="sidebar-bottom" href="/">
          ↩ Back to website
        </Link>
      </aside>
      <section className="dash-main">
        <div className="section-head admin-title">
          <div>
            <span className="eyebrow">ADMINISTRATION</span>
            <h1>Admin Dashboard</h1>
            <p>Monitor activity and keep InteriorFinder running smoothly.</p>
          </div>
          <span className="admin-date">October 25, 2026</span>
        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <small>Total Users</small>
            <strong>156</strong>
            <span>↑ 8% this month</span>
          </div>
          <div className="stat-card">
            <small>Designers</small>
            <strong>24</strong>
            <span>4 pending approval</span>
          </div>
          <div className="stat-card">
            <small>Portfolios</small>
            <strong>142</strong>
            <span>12 added this week</span>
          </div>
          <div className="stat-card">
            <small>Enquiries</small>
            <strong>87</strong>
            <span>16 need review</span>
          </div>
        </div>
        <section className="content-panel table-panel">
          <div className="section-head">
            <div>
              <h2>Recent Users</h2>
              <p>Latest accounts registered on the platform.</p>
            </div>
            <Link href="/designers" className="textlink">
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u[0]}>
                    {u.map((v, i) => (
                      <td key={i}>
                        {i === 3 ? (
                          <span className={`status ${v.toLowerCase()}`}>
                            {v}
                          </span>
                        ) : (
                          v
                        )}
                      </td>
                    ))}
                    <td>
                      <button className="table-action">Manage</button>
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
            {[
              ["New project request", "2 BHK apartment · Pune", "Just now"],
              [
                "New enquiry received",
                "Office interior · Mumbai",
                "1 hour ago",
              ],
              ["Designer application", "Portfolio review needed", "Today"],
            ].map((a) => (
              <div className="activity" key={a[0]}>
                <span className="activity-dot" />
                <div>
                  <b>{a[0]}</b>
                  <small>{a[1]}</small>
                  <small>{a[2]}</small>
                </div>
              </div>
            ))}
          </section>
          <section className="content-panel">
            <h2>System Activity</h2>
            {[
              ["✓", "Profile approved", "Riya Sharma was verified"],
              ["＋", "New portfolio", "A project was added"],
              ["✉", "Enquiry submitted", "A customer sent an enquiry"],
            ].map((a) => (
              <div className="activity" key={a[1]}>
                <span className="activity-icon">{a[0]}</span>
                <div>
                  <b>{a[1]}</b>
                  <small>{a[2]}</small>
                </div>
              </div>
            ))}
          </section>
        </div>
      </section>
    </div>
  );
}
