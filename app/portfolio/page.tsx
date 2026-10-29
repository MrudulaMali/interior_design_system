import Link from "next/link";
import { getApprovedPortfolioProjects } from "@/lib/designers";

const defaultInspirations = [
  { id: 1, title: "Warm Minimal Living & Dining", category: "Living room", designerCity: "Pune", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80", designerProfileId: 1, designerName: "Riya Sharma Designs" },
  { id: 2, title: "Modern Open Plan Kitchen", category: "Kitchen", designerCity: "Mumbai", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80", designerProfileId: 1, designerName: "Riya Sharma Designs" },
  { id: 3, title: "Soft Neutral Master Bedroom", category: "Bedroom", designerCity: "Pune", image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=80", designerProfileId: 1, designerName: "Contemporary Living" },
  { id: 4, title: "Boutique Executive Office Studio", category: "Commercial", designerCity: "Kolhapur", image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80", designerProfileId: 1, designerName: "Studio Luxe" },
];

export default async function Portfolio() {
  const realProjects = await getApprovedPortfolioProjects();
  const displayProjects = realProjects.length > 0 ? realProjects : defaultInspirations;

  return (
    <div className="page-wrap">
      <section className="page-hero portfolio-hero">
        <span className="eyebrow">DESIGN INSPIRATION</span>
        <h1>Interior Design Portfolio</h1>
        <p>
          Explore real transformations created by approved interior designers. Find inspiration for your living room, modular kitchen, bedroom, or commercial space.
        </p>
      </section>

      <div className="portfolio-toolbar">
        <div className="tag-list">
          <span>All Work ({displayProjects.length})</span>
          <span>Living Room</span>
          <span>Modular Kitchen</span>
          <span>Bedroom</span>
          <span>Commercial</span>
        </div>

        <Link href="/designers" className="btn btn-small" style={{ fontSize: "11px" }}>
          Explore Designers →
        </Link>
      </div>

      <div className="portfolio-grid big-portfolio">
        {displayProjects.map((project, index) => (
          <Link
            href={`/designer/${project.designerProfileId}`}
            className="project-card"
            key={`${project.id}-${index}`}
          >
            <div
              className="project-image"
              style={{
                backgroundImage: `url(${project.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />

            <div className="project-meta">
              <div>
                <h3 style={{ fontSize: "14px", margin: "0 0 4px" }}>{project.title}</h3>
                <small style={{ color: "var(--muted)" }}>
                  {project.category} · by {project.designerName} ({project.designerCity || "Verified Studio"})
                </small>
              </div>

              <span style={{ fontSize: "18px", color: "var(--green)" }}>↗</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}