import Link from "next/link";
export function generateStaticParams() {
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
    { id: "5" },
    { id: "6" },
  ];
}

export default async function DesignerProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="page-wrap">
      <div className="profile-cover" />
      <section className="profile-head">
        <div className="avatar">RS</div>
        <div className="profile-intro">
          <span className="eyebrow">✓ VERIFIED DESIGNER</span>
          <h1>Riya Sharma</h1>
          <p>Interior Designer · Modern & Minimal</p>
          <small>
            ⌖ Pune, Maharashtra　 ★ 4.9 (48 reviews)　 · 8 years experience
          </small>
        </div>
        <Link className="btn" href="/enquiry">
          Send Enquiry
        </Link>
      </section>
      <div className="profile-columns">
        <section className="content-panel">
          <h2>About Me</h2>
          <p>
            I create thoughtful, functional interiors that reflect each client's
            personality. My approach combines timeless materials, natural light
            and clean modern lines.
          </p>
          <h2>Services Offered</h2>
          <div className="tag-list">
            <span>Residential Interiors</span>
            <span>Space Planning</span>
            <span>Kitchen Design</span>
            <span>Full Home Design</span>
          </div>
          <h2>Selected Projects</h2>
          <div className="portfolio-grid">
            {[1, 2, 3, 4].map((n) => (
              <div className={`room-tile room-${n}`} key={n}>
                <span>Residential Project {n}</span>
              </div>
            ))}
          </div>
        </section>
        <aside className="content-panel contact-panel">
          <h3>Designer Overview</h3>
          <p>
            <b>Starting budget</b>
            <span>₹1,500 / sq. ft.</span>
          </p>
          <p>
            <b>Experience</b>
            <span>8+ years</span>
          </p>
          <p>
            <b>Projects completed</b>
            <span>24 projects</span>
          </p>
          <p>
            <b>Response time</b>
            <span>Within 24 hours</span>
          </p>
          <Link className="btn full" href={`/enquiry?designer=${id}`}>
            Contact Designer
          </Link>
        </aside>
      </div>
    </div>
  );
}
