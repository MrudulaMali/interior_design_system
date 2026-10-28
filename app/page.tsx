import Link from "next/link";
const designers = [
  ["Riya Sharma", "Modern & Minimal", "Pune", "4.9"],
  ["Aditya Mehta", "Contemporary", "Mumbai", "4.8"],
  ["Sneha Kapoor", "Luxury Interiors", "Kolhapur", "4.9"],
  ["Vikram Singh", "Residential Design", "Pune", "4.7"],
];
const rooms = ["Living Room", "Bedroom", "Kitchen", "Office"];
export default function Home() {
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
            Connect with talented interior designers and turn your vision into a
            beautiful, functional space.
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
          {designers.map((d, i) => (
            <article className="designer-card" key={d[0]}>
              <div className={`designer-photo photo-${i + 1}`}>
                <span className="verified">✓ Verified</span>
                <span className="heart">♡</span>
              </div>
              <div className="card-body">
                <div className="card-title">
                  <h3>{d[0]}</h3>
                  <span>★ {d[3]}</span>
                </div>
                <p>{d[1]}</p>
                <small>⌖ {d[2]} · 8+ years experience</small>
                <Link className="outline-btn" href={`/designer/${i + 1}`}>
                  View Profile
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section services">
        <div className="section-head">
          <div>
            <span className="eyebrow">MADE FOR YOUR SPACE</span>
            <h2>Explore Popular Services</h2>
          </div>
        </div>
        <div className="service-grid">
          {rooms.map((r, i) => (
            <Link href="/designers" className="service" key={r}>
              <span>{["⌂", "▤", "▦", "▥"][i]}</span>
              <b>{r}</b>
              <small>Explore ideas →</small>
            </Link>
          ))}
        </div>
      </section>
      <section className="cta">
        <div>
          <span className="eyebrow">YOUR DREAM SPACE STARTS HERE</span>
          <h2>
            Great design starts with
            <br />a conversation.
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
