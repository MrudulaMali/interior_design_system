import Link from "next/link";
import { notFound } from "next/navigation";
import { getApprovedDesignerById } from "@/lib/designers";
import { getCurrentUser } from "@/lib/auth";


export default async function DesignerProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const designerId = Number(id);

  if (isNaN(designerId) || designerId < 1) {
    notFound();
  }

  // Check if current visitor is an authenticated admin previewing the profile
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  // Authoritative query: retrieves strictly approved designer profile, or allows admin preview
  const result = await getApprovedDesignerById(designerId, isAdmin);

  if (!result || !result.designer) {
    return (
      <div className="page-wrap" style={{ textAlign: "center", padding: "80px 20px" }}>
        <span className="eyebrow">PROFILE NOT AVAILABLE</span>
        <h1 style={{ fontSize: "32px", color: "var(--deep)", margin: "12px 0 16px" }}>
          Designer Profile Not Found
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: "480px", margin: "0 auto 24px" }}>
          This designer profile is either inactive, under review, or does not exist. Only approved interior designers are published in the directory.
        </p>
        <Link href="/designers" className="btn btn-small">
          ← Return to Designers Directory
        </Link>
      </div>
    );
  }

  const { designer, projects, rawStatus } = result;

  return (
    <div className="page-wrap">
      {isAdmin && rawStatus !== "approved" && (
        <div
          style={{
            padding: "12px 18px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "6px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <b style={{ color: "#92400e", fontSize: "13px" }}>
              🛡 Administrator Preview Mode — Status: {rawStatus?.toUpperCase()}
            </b>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#b45309" }}>
              This profile is currently hidden from public visitors until approved in the Admin Control Panel.
            </p>
          </div>
          <Link href="/admin/dashboard" className="btn btn-small" style={{ fontSize: "11px" }}>
            ← Back to Admin Panel
          </Link>
        </div>
      )}

      <div
        className="profile-cover"
        style={{
          backgroundImage: designer.portfolioImages.length > 0
            ? `url(${designer.portfolioImages[0]})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <section className="profile-head">
        <div className="avatar">
          {designer.name ? designer.name.charAt(0).toUpperCase() : "D"}
        </div>

        <div className="profile-intro">
          <span className="eyebrow">✓ VERIFIED INTERIOR DESIGNER</span>
          <h1>{designer.name}</h1>
          <p>{designer.title} · {designer.style}</p>
          <small>
            ⌖ {designer.city} · ★ {designer.rating} ({designer.reviewsCount} reviews) · {designer.experienceYears}+ years experience
          </small>
        </div>

        <Link className="btn" href={`/enquiry?designer=${designer.id}`}>
          Send Enquiry ↗
        </Link>
      </section>

      <div className="profile-columns">
        <section className="content-panel">
          <h2>About Me</h2>
          <p style={{ lineHeight: 1.8, color: "#4b5563" }}>
            {designer.bio ||
              `${designer.name} is a professional interior designer specializing in ${designer.style} spaces. Offering full turnkey execution, space planning, and contemporary styling across ${designer.city} and surrounding areas.`}
          </p>

          <h2>Services & Specializations</h2>
          <div className="tag-list" style={{ marginBottom: "24px" }}>
            {designer.services.map((srv) => (
              <span key={srv}>{srv}</span>
            ))}
            {designer.specializations.map((spec) => (
              <span key={spec} style={{ background: "var(--mint)", color: "var(--green)" }}>
                {spec}
              </span>
            ))}
          </div>

          <h2>Selected Portfolio Projects</h2>
          {projects.length > 0 ? (
            <div style={{ display: "grid", gap: "24px" }}>
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: "8px",
                    padding: "16px",
                    background: "#fbfcf9",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", color: "var(--deep)" }}>{proj.title}</h3>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>{proj.category}</span>
                  </div>

                  {proj.description && (
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 12px", lineHeight: 1.6 }}>
                      {proj.description}
                    </p>
                  )}

                  {Array.isArray(proj.images) && proj.images.length > 0 && (
                    <div className="portfolio-grid">
                      {proj.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="room-tile"
                          style={{
                            backgroundImage: `url(${img.url})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          {img.caption && <span>{img.caption}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : designer.portfolioImages.length > 0 ? (
            <div className="portfolio-grid">
              {designer.portfolioImages.map((url, idx) => (
                <div
                  key={idx}
                  className="room-tile"
                  style={{
                    backgroundImage: `url(${url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <span>Featured Design Space</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "24px", background: "#fbfcf9", borderRadius: "6px", textAlign: "center", color: "var(--muted)" }}>
              No portfolio photos uploaded yet. Contact designer for portfolio catalog.
            </div>
          )}
        </section>

        <aside className="content-panel contact-panel">
          <h3>Studio Overview</h3>
          <p>
            <b>Starting budget</b>
            <span style={{ color: "var(--green)" }}>{designer.startingBudget}</span>
          </p>
          <p>
            <b>Experience</b>
            <span>{designer.experienceYears}+ years</span>
          </p>
          <p>
            <b>Service locations</b>
            <span>{designer.serviceLocations.join(", ")}</span>
          </p>
          <p>
            <b>Projects completed</b>
            <span>{designer.projectsCount}+ projects</span>
          </p>
          {designer.phone && (
            <p>
              <b>Direct Contact</b>
              <span>{designer.phone}</span>
            </p>
          )}
          <p>
            <b>Response time</b>
            <span>Within 24 hours</span>
          </p>

          <Link className="btn full" href={`/enquiry?designer=${designer.id}`} style={{ marginTop: "20px" }}>
            Contact {designer.name.split(" ")[0]}
          </Link>
        </aside>
      </div>
    </div>
  );
}