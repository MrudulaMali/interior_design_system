
import Link from 'next/link';

const enquiries = [
  {
    name: 'Aarav Desai',
    project: '2 BHK Apartment',
    location: 'Pune',
    date: 'Oct 24, 2026',
    status: 'New',
  },
  {
    name: 'Mira Shah',
    project: 'Office Interior',
    location: 'Mumbai',
    date: 'Oct 23, 2026',
    status: 'In Progress',
  },
  {
    name: 'Kabir Patil',
    project: 'Kitchen Renovation',
    location: 'Kolhapur',
    date: 'Oct 22, 2026',
    status: 'Responded',
  },
  {
    name: 'Anaya Kulkarni',
    project: 'Full Home Design',
    location: 'Pune',
    date: 'Oct 21, 2026',
    status: 'New',
  },
];

const navigation = [
  { icon: '▦', label: 'Overview', href: '/dashboard' },
  { icon: '▤', label: 'My Portfolio', href: '/portfolio' },
  { icon: '✉', label: 'Enquiries', href: '/enquiry' },
  { icon: '◷', label: 'Availability', href: '/dashboard' },
  { icon: '⚙', label: 'Settings', href: '/dashboard' },
];

export default function Dashboard() {
  return (
    <div className="dashboard-layout">
      <aside className="dash-sidebar">
        <div className="dash-user">
          <div className="avatar small-avatar">PS</div>
          <b>Priya Sharma</b>
          <small>Interior Designer</small>
        </div>

        {navigation.map((item) => (
          <Link
            href={item.href}
            className={
              item.label === 'Overview' ? 'active' : ''
            }
            key={item.label}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <Link className="sidebar-bottom" href="/">
          ↩ Back to website
        </Link>
      </aside>

      <section className="dash-main">
        <div className="dash-welcome">
          <div>
            <span className="eyebrow">
              DESIGNER WORKSPACE
            </span>

            <h1>Welcome, Priya!</h1>

            <p>
              Here's what's happening with your design business.
            </p>
          </div>

          <div className="dash-banner">
            <b>Make your profile shine</b>
            <small>Keep your portfolio up to date.</small>

            <Link href="/portfolio">
              Update portfolio →
            </Link>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <small>Total Enquiries</small>
            <strong>58</strong>
            <span>↑ 12% this month</span>
          </div>

          <div className="stat-card">
            <small>Active Projects</small>
            <strong>8</strong>
            <span>Across 4 locations</span>
          </div>

          <div className="stat-card">
            <small>Profile Views</small>
            <strong>1,243</strong>
            <span>↑ 8% this month</span>
          </div>

          <div className="stat-card">
            <small>Average Rating</small>
            <strong>4.9 ★</strong>
            <span>From 48 reviews</span>
          </div>
        </div>

        <section className="content-panel table-panel">
          <div className="section-head">
            <div>
              <h2>Recent Enquiries</h2>
              <p>
                Review and respond to new project requests.
              </p>
            </div>

            <Link className="textlink" href="/enquiry">
              View all →
            </Link>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Project</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.name}>
                    <td>{enquiry.name}</td>
                    <td>{enquiry.project}</td>
                    <td>{enquiry.location}</td>
                    <td>{enquiry.date}</td>

                    <td>
                      <span
                        className={`status ${enquiry.status
                          .toLowerCase()
                          .replace(' ', '-')}`}
                      >
                        {enquiry.status}
                      </span>
                    </td>

                    <td>
                      <Link
                        href="/enquiry"
                        className="textlink"
                      >
                        View ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="quick-grid">
          <Link
            href="/portfolio"
            className="quick-card"
          >
            <span>▧</span>
            <b>Manage Portfolio</b>
            <small>
              Add projects and inspire clients.
            </small>
          </Link>

          <Link
            href="/enquiry"
            className="quick-card"
          >
            <span>✉</span>
            <b>Review Enquiries</b>
            <small>
              Respond to customer requests.
            </small>
          </Link>

          <Link
            href="/designers"
            className="quick-card"
          >
            <span>◉</span>
            <b>Preview Profile</b>
            <small>
              See how clients view your profile.
            </small>
          </Link>
        </div>
      </section>
    </div>
  );
}
