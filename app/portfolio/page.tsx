
"use client";

import { useMemo, useState } from "react";

interface Project {
  id: number;
  title: string;
  category: string;
  city: string;
  popularity: number;
  year: number;
}

const projects: Project[] = [
  { id: 1, title: "Warm Minimal Living", category: "Residential", city: "Pune", popularity: 95, year: 2026 },
  { id: 2, title: "A Calm City Apartment", category: "Apartment", city: "Mumbai", popularity: 90, year: 2025 },
  { id: 3, title: "Natural Modern Kitchen", category: "Kitchen", city: "Kolhapur", popularity: 98, year: 2026 },
  { id: 4, title: "Boutique Office Studio", category: "Commercial", city: "Pune", popularity: 85, year: 2025 },
  { id: 5, title: "Contemporary Family Home", category: "Residential", city: "Nashik", popularity: 92, year: 2024 },
  { id: 6, title: "A Refined Bedroom", category: "Bedroom", city: "Mumbai", popularity: 88, year: 2026 },
  { id: 7, title: "Modern Open Plan", category: "Residential", city: "Pune", popularity: 80, year: 2025 },
  { id: 8, title: "Elegant Dining Space", category: "Dining", city: "Kolhapur", popularity: 82, year: 2024 },
  { id: 9, title: "Soft Neutral Retreat", category: "Bedroom", city: "Mumbai", popularity: 87, year: 2025 },
];

const categories = [
  "All Projects",
  "Residential",
  "Commercial",
  "Kitchen",
  "Bedroom",
];

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState("All Projects");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      if (activeCategory === "All Projects") return true;
      return project.category === activeCategory;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "newest") return b.year - a.year;
      return b.popularity - a.popularity;
    });
  }, [activeCategory, sortBy]);

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
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={
                activeCategory === category ? "active" : ""
              }
              style={{
                border: "none",
                cursor: "pointer",
                padding: "10px 14px",
                borderRadius: "5px",
                background:
                  activeCategory === category ? "#14594c" : "#edf3ed",
                color:
                  activeCategory === category ? "#ffffff" : "#14594c",
              }}
            >
              {category}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          aria-label="Sort projects"
        >
          <option value="popular">Most popular</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      <p style={{ margin: "12px 0", color: "var(--muted)" }}>
        Showing {filteredProjects.length} projects
      </p>

      <div className="portfolio-grid big-portfolio">
        {filteredProjects.map((project, index) => (
          <button
            type="button"
            className="project-card"
            key={project.id}
            onClick={() => setSelectedProject(project)}
            style={{
              textAlign: "left",
              width: "100%",
              cursor: "pointer",
              font: "inherit",
              background: "#ffffff",
              color: "inherit",
              border: "1px solid var(--line)",
              padding: 0,
            }}
          >
            <div
              className={`project-image room-${(index % 4) + 1}`}
            />

            <div className="project-meta">
              <div>
                <h3>{project.title}</h3>
                <small>
                  {project.category} · {project.city}
                </small>
              </div>

              <span>↗</span>
            </div>
          </button>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <p>No projects found in this category.</p>
      )}

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
            background: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "#ffffff",
              color: "#24352f",
              borderRadius: "12px",
              padding: "28px",
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              aria-label="Close project details"
              style={{
                float: "right",
                border: "none",
                background: "transparent",
                fontSize: "22px",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <span className="eyebrow">PROJECT DETAILS</span>
            <h2>{selectedProject.title}</h2>
            <p>
              Category: {selectedProject.category}
            </p>
            <p>Location: {selectedProject.city}</p>
            <p>Project year: {selectedProject.year}</p>
            <button
              type="button"
              className="btn"
              onClick={() => setSelectedProject(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
