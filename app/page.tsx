import Link from "next/link";
import { Suspense } from "react";
import { getApprovedDesigners } from "@/lib/designers";

const rooms = ["Living Room", "Bedroom", "Kitchen", "Office"];

export default function Home() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "40px" }}>Loading designers...</div>}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  // Authoritative query: retrieves approved designers dynamically
  const featuredDesigners = await getApprovedDesigners(4);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">DESIGN YOUR EVERYDAY</span>

          <h1>
            Find Your Perfect
            <br />
            <em>Interior Designer</em>
          </h1>

          <p>
            Connect with talented interior designers and turn your vision
            into a beautiful, functional space.
          </p>

          <div className="hero-points">
            <span>✓ Verified professionals</span>
            <span>✓ Inspiring portfolios</span>
            <span>✓ Easy enquiries</span>
          </div>

          <Link className="btn" href="/designers">
            Explore Designers ↗
          </Link>
        </div>

        <div className="hero-image">
          <div className="image-label">
            <b>Spaces that feel like you.</b>
            <small>Thoughtful design. Beautiful living.</small>
          </div>
        </div>
      </section>

      <section className="search-strip">
        <div>
          <small>LOCATION</small>
          <b>⌖ Choose your city</b>
        </div>

        <div>
          <small>SPACE TYPE</small>
          <b>▦ Select a space</b>
        </div>

        <div>
          <small>BUDGET</small>
          <b>₹ Your budget</b>
        </div>

        <Link className="btn" href="/designers">
          Search Designers
        </Link>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">MEET THE EXPERTS</span>
            <h2>Featured Designers</h2>
            <p>Creative minds ready to bring your ideas to life.</p>
          </div>

          <Link className="textlink" href="/designers">
            View all designers →
          </Link>
        </div>

        <div className="designer-grid">
          {featuredDesigners.map((designer) => (
            <article className="designer-card" key={designer.id}>
              <div className="designer-photo" style={{ backgroundImage: designer.image ? `url(${designer.image})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
                {!designer.image && (
                  <div
                    style={{
                      height: "100%",
                      display: "grid",
                      placeItems: "center",
                      color: "var(--muted)",
                      fontSize: "12px",
                      background: "var(--mint)",
                    }}
                  >
                    Interior Studio
                  </div>
                )}

                {designer.isVerified && (
                  <span className="verified">✓ Verified</span>
                )}
              </div>

              <div className="card-body">
                <div className="card-title">
                  <h3>{designer.name}</h3>
                  <span>★ {designer.rating}</span>
                </div>

                <p>{designer.style}</p>

                <small>
                  ⌖ {designer.city} · {designer.experienceYears}+ years experience
                </small>

                <Link
                  className="outline-btn"
                  href={`/designer/${designer.id}`}
                >
                  View Profile
                </Link>
              </div>
            </article>
          ))}
        </div>

        {featuredDesigners.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
            <p>No approved designers yet. New designer profiles will appear once approved by admin.</p>
          </div>
        )}
      </section>

      <section className="section services">
        <div className="section-head">
          <div>
            <span className="eyebrow">MADE FOR YOUR SPACE</span>
            <h2>Explore Popular Services</h2>
          </div>
        </div>

        <div className="service-grid">
          {rooms.map((room, index) => (
            <Link
              href={`/designers`}
              className="service"
              key={room}
            >
              <span>{["⌂", "▤", "▦", "▥"][index]}</span>
              <b>{room}</b>
              <small>Explore ideas →</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="cta">
        <div>
          <span className="eyebrow">
            YOUR DREAM SPACE STARTS HERE
          </span>

          <h2>
            Great design starts with
            <br />
            a conversation.
          </h2>

          <p>
            Tell us about your project and connect with the right professional.
          </p>
        </div>

        <Link className="btn btn-light" href="/enquiry">
          Send an Enquiry ↗
        </Link>
      </section>
    </>
  );
}