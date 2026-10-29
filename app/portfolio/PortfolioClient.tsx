"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicProjectItem } from "@/lib/designers";

interface PortfolioClientProps {
  initialProjects: PublicProjectItem[];
}

export default function PortfolioClient({ initialProjects }: PortfolioClientProps) {
  const [activeCategory, setActiveCategory] = useState("All Projects");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [selectedProject, setSelectedProject] = useState<PublicProjectItem | null>(null);

  // Extract all categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of initialProjects) {
      if (p.category) {
        set.add(p.category.trim());
      }
    }
    const list = Array.from(set);
    return ["All Projects", ...list];
  }, [initialProjects]);

  const filteredProjects = useMemo(() => {
    return initialProjects
      .filter((project) => {
        const matchesCategory =
          activeCategory === "All Projects" ||
          project.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
          activeCategory.toLowerCase().includes(project.category.toLowerCase());

        const matchesSearch =
          !search ||
          project.title.toLowerCase().includes(search.toLowerCase()) ||
          project.designerName.toLowerCase().includes(search.toLowerCase()) ||
          project.designerCity.toLowerCase().includes(search.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(search.toLowerCase()));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "alpha") {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === "designer") {
          return a.designerName.localeCompare(b.designerName);
        }
        return 0; // default order from database
      });
  }, [initialProjects, activeCategory, search, sortBy]);

  return (
    <div className="page-wrap">
      <section className="page-hero portfolio-hero" style={{ marginBottom: "28px" }}>
        <span className="eyebrow">DESIGN INSPIRATION & VERIFIED WORK</span>
        <h1 style={{ marginBottom: "12px" }}>Interior Design Portfolio</h1>
        <p style={{ maxWidth: "600px", lineHeight: "1.7", color: "var(--muted)" }}>
          Explore real spaces and transformations created by approved interior designers. Browse living rooms, modular kitchens, luxury bedrooms, and workspaces.
        </p>
      </section>

      {/* Toolbar / Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              style={{
                border: "none",
                cursor: "pointer",
                padding: "8px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: activeCategory === category ? 600 : 500,
                background: activeCategory === category ? "var(--green)" : "#edf3ed",
                color: activeCategory === category ? "#ffffff" : "#14594c",
                transition: "all 0.15s ease",
              }}
            >
              {category}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search projects, styles, cities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              fontSize: "12px",
              minWidth: "200px",
            }}
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              fontSize: "12px",
              background: "#fff",
              cursor: "pointer",
            }}
            aria-label="Sort projects"
          >
            <option value="default">Featured / Newest</option>
            <option value="alpha">Alphabetical</option>
            <option value="designer">By Designer</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>
          Showing <strong>{filteredProjects.length}</strong> {filteredProjects.length === 1 ? "project" : "projects"}
        </p>

        <Link href="/designers" className="btn btn-small" style={{ fontSize: "11px", padding: "6px 14px" }}>
          Browse All Designers →
        </Link>
      </div>

      {/* Grid */}
      {filteredProjects.length > 0 ? (
        <div className="portfolio-grid big-portfolio">
          {filteredProjects.map((project, index) => (
            <div
              key={`${project.id}-${project.designerProfileId}-${index}`}
              className="project-card"
              style={{
                border: "1px solid var(--line)",
                borderRadius: "8px",
                overflow: "hidden",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onClick={() => setSelectedProject(project)}
            >
              <div
                style={{
                  height: "220px",
                  backgroundImage: `url(${project.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: "#e8ece8",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    background: "rgba(255, 255, 255, 0.92)",
                    color: "var(--green)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {project.category}
                </span>
              </div>

              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
                <h3 style={{ fontSize: "15px", margin: "0 0 6px", color: "var(--deep)", fontWeight: 600 }}>
                  {project.title}
                </h3>
                <small style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "12px" }}>
                  By <strong>{project.designerName}</strong> · {project.designerCity || "Verified Designer"}
                </small>

                {project.description && (
                  <p
                    style={{
                      margin: "0 0 14px",
                      fontSize: "12px",
                      color: "#52615a",
                      lineHeight: "1.5",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {project.description}
                  </p>
                )}

                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "10px",
                    borderTop: "1px solid #f0f3f0",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "var(--green)", fontWeight: 600 }}>Quick Preview</span>
                  <Link
                    href={`/designer/${project.designerProfileId}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: "11px",
                      color: "var(--deep)",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      textDecoration: "underline",
                    }}
                  >
                    View Studio ↗
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            background: "#fafafa",
            border: "1px dashed var(--line)",
            borderRadius: "8px",
            padding: "40px 20px",
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          <p style={{ margin: "0 0 12px", fontSize: "14px" }}>No projects match your current filter criteria.</p>
          <button
            type="button"
            className="btn btn-small"
            onClick={() => {
              setActiveCategory("All Projects");
              setSearch("");
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Project details"
          onClick={() => setSelectedProject(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "680px",
              background: "#ffffff",
              color: "#24352f",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Image */}
            <div
              style={{
                height: "320px",
                width: "100%",
                backgroundImage: `url(${selectedProject.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "relative",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                aria-label="Close modal"
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  border: "none",
                  background: "rgba(0, 0, 0, 0.55)",
                  color: "#ffffff",
                  fontSize: "18px",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "24px 28px", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                <div>
                  <span className="eyebrow" style={{ marginBottom: "6px" }}>
                    {selectedProject.category} · {selectedProject.designerCity}
                  </span>
                  <h2 style={{ fontSize: "22px", margin: "0 0 8px", color: "var(--deep)" }}>
                    {selectedProject.title}
                  </h2>
                  <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: "13px" }}>
                    Designed by <strong>{selectedProject.designerName}</strong>
                  </p>
                </div>

                <Link
                  href={`/designer/${selectedProject.designerProfileId}`}
                  className="btn"
                  style={{ fontSize: "12px", padding: "10px 18px", whiteSpace: "nowrap" }}
                >
                  View Profile & Enquire ↗
                </Link>
              </div>

              {selectedProject.description && (
                <div style={{ borderTop: "1px solid var(--line)", paddingTop: "14px", marginTop: "8px" }}>
                  <h4 style={{ fontSize: "13px", margin: "0 0 6px", color: "var(--deep)" }}>About this project</h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "#45554f", lineHeight: "1.6" }}>
                    {selectedProject.description}
                  </p>
                </div>
              )}

              {selectedProject.caption && (
                <p style={{ margin: "10px 0 0", fontSize: "12px", fontStyle: "italic", color: "var(--muted)" }}>
                  “{selectedProject.caption}”
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
