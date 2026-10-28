import Link from "next/link";
const people = [
  ["Riya Sharma", "Modern & Minimal", "Pune", "4.9", "12 projects"],
  ["Aditya Mehta", "Contemporary Design", "Mumbai", "4.8", "18 projects"],
  ["Sneha Kapoor", "Luxury Interiors", "Kolhapur", "4.9", "24 projects"],
  ["Vikram Singh", "Residential Specialist", "Pune", "4.7", "16 projects"],
  ["Neha Joshi", "Scandinavian Design", "Nashik", "4.8", "11 projects"],
  ["Arjun Rao", "Commercial Interiors", "Mumbai", "4.7", "20 projects"],
];
export default function Designers() {
  return (
    <div className="page-wrap">
      <section className="page-hero">
        <span className="eyebrow">YOUR SPACE, YOUR STYLE</span>
        <h1>Find Interior Designers</h1>
        <p>Discover experienced professionals who understand your vision.</p>
        <div className="mini-search">
          <input placeholder="Search by designer name or style" />
          <select defaultValue="all">
            <option value="all">All locations</option>
            <option>Pune</option>
            <option>Mumbai</option>
            <option>Kolhapur</option>
          </select>
          <button className="btn">Search</button>
        </div>
      </section>
      <div className="listing-layout">
        <aside className="filters">
          <h3>Filters</h3>
          <label>
            Location
            <select>
              <option>All locations</option>
              <option>Pune</option>
              <option>Mumbai</option>
              <option>Kolhapur</option>
            </select>
          </label>
          <label>
            Design style
            <select>
              <option>All styles</option>
              <option>Modern</option>
              <option>Contemporary</option>
              <option>Minimal</option>
              <option>Luxury</option>
            </select>
          </label>
          <h4>Services</h4>
          {["Residential", "Commercial", "Kitchen", "Living room"].map((x) => (
            <label className="check-label" key={x}>
              <input type="checkbox" />
              {x}
            </label>
          ))}
          <h4>Minimum rating</h4>
          <label className="check-label">
            <input type="checkbox" /> ★★★★☆ and above
          </label>
          <button className="outline-btn full">Apply Filters</button>
        </aside>
        <section>
          <div className="results-head">
            <div>
              <h2>Designers for you</h2>
              <p>32 designers found</p>
            </div>
            <select>
              <option>Recommended</option>
              <option>Highest rated</option>
              <option>Most experienced</option>
            </select>
          </div>
          <div className="designer-grid listing-grid">
            {people.map((d, i) => (
              <article className="designer-card" key={d[0]}>
                <div className={`designer-photo photo-${(i % 4) + 1}`}>
                  <span className="verified">✓ Verified</span>
                  <span className="heart">♡</span>
                </div>
                <div className="card-body">
                  <div className="card-title">
                    <h3>{d[0]}</h3>
                    <span>★ {d[3]}</span>
                  </div>
                  <p>{d[1]}</p>
                  <small>
                    ⌖ {d[2]} · {d[4]}
                  </small>
                  <Link className="outline-btn" href={`/designer/${i + 1}`}>
                    View Profile
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
