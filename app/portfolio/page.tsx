
import Link from 'next/link';

const projects = [
  ['Warm Minimal Living', 'Residential', 'Pune'],
  ['A Calm City Apartment', 'Apartment', 'Mumbai'],
  ['Natural Modern Kitchen', 'Kitchen', 'Kolhapur'],
  ['Boutique Office Studio', 'Commercial', 'Pune'],
  ['Contemporary Family Home', 'Residential', 'Nashik'],
  ['A Refined Bedroom', 'Bedroom', 'Mumbai'],
  ['Modern Open Plan', 'Residential', 'Pune'],
  ['Elegant Dining Space', 'Dining', 'Kolhapur'],
  ['Soft Neutral Retreat', 'Bedroom', 'Mumbai'],
];

export default function Portfolio() {
  return (
    <div className="page-wrap">
      <section className="page-hero portfolio-hero">
        <span className="eyebrow">IDEAS FOR EVERY CORNER</span>
        <h1>Interior Design Portfolio</h1>
        <p>
          Explore real projects, discover your style and save inspiration
          for your next space.
        </p>
      </section>

      <div className="portfolio-toolbar">
        <div className="tag-list">
          <span>All Projects</span>
          <span>Residential</span>
          <span>Commercial</span>
          <span>Kitchen</span>
          <span>Bedroom</span>
        </div>

        <select defaultValue="popular" aria-label="Sort projects">
          <option value="popular">Most popular</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      <div className="portfolio-grid big-portfolio">
        {projects.map((project, index) => (
          <Link
            href="/designers"
            className="project-card"
            key={project[0]}
          >
            <div className={`project-image room-${(index % 4) + 1}`} />

            <div className="project-meta">
              <div>
                <h3>{project[0]}</h3>
                <small>
                  {project[1]} · {project[2]}
                </small>
              </div>

              <span>↗</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
