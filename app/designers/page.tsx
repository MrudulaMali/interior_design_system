"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Designer = {
  id: number;
  name: string;
  style: string;
  city: string;
  rating: string | number;
  experienceYears: number;
  projects: number;
  services: string[];
  image: string | null;
  bio: string | null;
  isVerified: boolean;
};

// Core services commonly sought by homeowners
const defaultCoreServices = [
  "Modular Kitchen",
  "Full Home Turnkey Design",
  "Living & Dining Styling",
  "Space Planning & Layouts",
  "Commercial & Office Interiors",
  "Renovation & Remodeling",
  "3D Visualization",
];

/**
 * Robust matching helper for designer services.
 * Supports exact matching, substring inclusion, and semantic keyword synonyms.
 */
function checkServiceMatch(
  selectedService: string,
  designerServices: string[] = [],
  designerStyle?: string,
  designerBio?: string | null
): boolean {
  const selected = selectedService.toLowerCase().trim();

  // Keyword maps for flexible semantic matching
  const synonymMap: Record<string, string[]> = {
    "modular kitchen": ["kitchen", "modular kitchen", "cooktop", "cabinetry"],
    "kitchen": ["kitchen", "modular kitchen"],
    "full home turnkey design": ["full home", "turnkey", "residential", "complete home", "end-to-end"],
    "residential": ["residential", "home", "villa", "apartment", "turnkey"],
    "living & dining styling": ["living", "dining", "lounge", "drawing room", "hall"],
    "living room": ["living", "lounge", "drawing room"],
    "space planning & layouts": ["space planning", "planning", "layout", "floor plan"],
    "commercial & office interiors": ["commercial", "office", "workspace", "retail", "corporate"],
    "commercial": ["commercial", "office", "retail", "corporate"],
    "renovation & remodeling": ["renovation", "remodeling", "refurbishment", "makeover"],
    "3d visualization": ["3d", "visualization", "walkthrough", "render"],
    "3d visualization & walkthroughs": ["3d", "visualization", "walkthrough", "render"],
    "bedroom": ["bedroom", "master suite", "wardrobe"],
  };

  const keywords = synonymMap[selected] || [selected];

  // 1. Direct or partial match in designer.services array
  for (const s of designerServices) {
    if (!s) continue;
    const lower = s.toLowerCase();
    if (lower === selected || lower.includes(selected) || selected.includes(lower)) {
      return true;
    }
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return true;
      }
    }
  }

  // 2. Check in designer style
  if (designerStyle) {
    const styleLower = designerStyle.toLowerCase();
    for (const kw of keywords) {
      if (styleLower.includes(kw)) {
        return true;
      }
    }
  }

  // 3. Check in designer bio
  if (designerBio) {
    const bioLower = designerBio.toLowerCase();
    for (const kw of keywords) {
      if (bioLower.includes(kw)) {
        return true;
      }
    }
  }

  return false;
}

export default function Designers() {
  const [people, setPeople] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [style, setStyle] = useState("all");
  const [services, setServices] = useState<string[]>([]);
  const [minimumRating, setMinimumRating] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    location: "all",
    style: "all",
    services: [] as string[],
    minimumRating: false,
  });

  useEffect(() => {
    let active = true;

    async function loadDesigners() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/designers", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load designers from the database.");
        }

        const data: Designer[] = await response.json();

        if (active) {
          setPeople(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading designers."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDesigners();

    return () => {
      active = false;
    };
  }, []);

  const locations = useMemo(
    () =>
      Array.from(
        new Set(people.map((person) => person.city).filter(Boolean))
      ).sort(),
    [people]
  );

  const styles = useMemo(
    () =>
      Array.from(
        new Set(people.map((person) => person.style).filter(Boolean))
      ).sort(),
    [people]
  );

  // Dynamic service list: combine core high-frequency services + any custom services in loaded designers
  const availableServices = useMemo(() => {
    const set = new Set<string>(defaultCoreServices);
    for (const p of people) {
      if (Array.isArray(p.services)) {
        for (const s of p.services) {
          if (s && s.trim().length > 0 && s.length <= 32) {
            // Avoid adding duplicates that already match core services
            const matchesCore = defaultCoreServices.some(
              (cs) => cs.toLowerCase() === s.toLowerCase() || s.toLowerCase().includes(cs.toLowerCase())
            );
            if (!matchesCore) {
              set.add(s.trim());
            }
          }
        }
      }
    }
    return Array.from(set);
  }, [people]);

  // Compute how many designers offer each service
  function getServiceDesignerCount(serviceName: string) {
    return people.filter((p) =>
      checkServiceMatch(serviceName, p.services, p.style, p.bio)
    ).length;
  }

  const filteredPeople = useMemo(() => {
    let result = people.filter((person) => {
      const searchText = appliedFilters.search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        person.name.toLowerCase().includes(searchText) ||
        person.style.toLowerCase().includes(searchText) ||
        person.city.toLowerCase().includes(searchText) ||
        (person.services ?? []).some((s) => s.toLowerCase().includes(searchText));

      const matchesLocation =
        appliedFilters.location === "all" ||
        person.city.toLowerCase() === appliedFilters.location.toLowerCase();

      const matchesStyle =
        appliedFilters.style === "all" ||
        person.style.toLowerCase().includes(appliedFilters.style.toLowerCase());

      // Service matching: if any services are checked, person must match ANY of the selected services
      const matchesServices =
        appliedFilters.services.length === 0 ||
        appliedFilters.services.some((selectedService) =>
          checkServiceMatch(selectedService, person.services, person.style, person.bio)
        );

      const matchesRating =
        !appliedFilters.minimumRating || Number(person.rating) >= 4.5;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesStyle &&
        matchesServices &&
        matchesRating
      );
    });

    if (sortBy === "highest") {
      result = [...result].sort((a, b) => Number(b.rating) - Number(a.rating));
    } else if (sortBy === "experienced") {
      result = [...result].sort((a, b) => b.experienceYears - a.experienceYears);
    }

    return result;
  }, [people, appliedFilters, sortBy]);

  // Real-time toggle service
  function toggleService(service: string) {
    const updated = services.includes(service)
      ? services.filter((item) => item !== service)
      : [...services, service];
    setServices(updated);
    setAppliedFilters((prev) => ({
      ...prev,
      services: updated,
    }));
  }

  // Real-time location change
  function handleLocationChange(val: string) {
    setLocation(val);
    setAppliedFilters((prev) => ({
      ...prev,
      location: val,
    }));
  }

  // Real-time style change
  function handleStyleChange(val: string) {
    setStyle(val);
    setAppliedFilters((prev) => ({
      ...prev,
      style: val,
    }));
  }

  // Real-time rating change
  function handleRatingChange(checked: boolean) {
    setMinimumRating(checked);
    setAppliedFilters((prev) => ({
      ...prev,
      minimumRating: checked,
    }));
  }

  function applyFilters() {
    setAppliedFilters({
      search,
      location,
      style,
      services: [...services],
      minimumRating,
    });
  }

  function resetFilters() {
    setSearch("");
    setLocation("all");
    setStyle("all");
    setServices([]);
    setMinimumRating(false);
    setSortBy("recommended");

    setAppliedFilters({
      search: "",
      location: "all",
      style: "all",
      services: [],
      minimumRating: false,
    });
  }

  return (
    <div className="page-wrap">
      <section className="page-hero">
        <span className="eyebrow">YOUR SPACE, YOUR STYLE</span>
        <h1>Find Interior Designers</h1>
        <p>Discover experienced professionals who understand your vision.</p>

        <form
          className="mini-search"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
          <input
            type="search"
            placeholder="Search by designer name, style, or services..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={location}
            onChange={(event) => handleLocationChange(event.target.value)}
            aria-label="Search by location"
          >
            <option value="all">All locations</option>
            {locations.map((city) => (
              <option value={city} key={city}>
                {city}
              </option>
            ))}
          </select>

          <button className="btn" type="submit">
            Search
          </button>
        </form>
      </section>

      <div className="listing-layout">
        {/* Filters Sidebar */}
        <aside className="filters">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0 }}>Filters</h3>
            {(appliedFilters.services.length > 0 ||
              appliedFilters.location !== "all" ||
              appliedFilters.style !== "all" ||
              appliedFilters.minimumRating ||
              appliedFilters.search) && (
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  background: "none",
                  border: "none",
                  color: "#991b1b",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Clear all
              </button>
            )}
          </div>

          <label>
            Location
            <select
              value={location}
              onChange={(event) => handleLocationChange(event.target.value)}
            >
              <option value="all">All locations</option>
              {locations.map((city) => (
                <option value={city} key={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label>
            Design style
            <select
              value={style}
              onChange={(event) => handleStyleChange(event.target.value)}
            >
              <option value="all">All styles</option>
              {styles.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {/* Service Filter Checkboxes */}
          <h4>Services Offered</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            {availableServices.map((service) => {
              const count = getServiceDesignerCount(service);
              const isChecked = services.includes(service);
              return (
                <label
                  className="check-label"
                  key={service}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "3px 0",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleService(service)}
                    />
                    {service}
                  </span>
                  <small style={{ color: "var(--muted)", fontSize: "11px" }}>({count})</small>
                </label>
              );
            })}
          </div>

          <h4>Minimum rating</h4>
          <label className="check-label" style={{ marginBottom: "16px" }}>
            <input
              type="checkbox"
              checked={minimumRating}
              onChange={(event) => handleRatingChange(event.target.checked)}
            />
            ★★★★☆ and above (4.5+)
          </label>

          <button
            className="outline-btn full"
            type="button"
            onClick={applyFilters}
          >
            Apply Filters
          </button>

          <button
            className="outline-btn full"
            type="button"
            onClick={resetFilters}
            style={{ marginTop: "8px" }}
          >
            Reset Filters
          </button>
        </aside>

        {/* Results Area */}
        <section>
          <div className="results-head">
            <div>
              <h2>Designers for you</h2>
              <p>
                {loading
                  ? "Loading designers..."
                  : `${filteredPeople.length} ${filteredPeople.length === 1 ? "designer" : "designers"} found`}
              </p>
            </div>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort designers"
            >
              <option value="recommended">Recommended</option>
              <option value="highest">Highest rated</option>
              <option value="experienced">Most experienced</option>
            </select>
          </div>

          {/* Active Filter Pills */}
          {(appliedFilters.services.length > 0 ||
            appliedFilters.location !== "all" ||
            appliedFilters.style !== "all" ||
            appliedFilters.minimumRating ||
            appliedFilters.search) && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "8px",
                marginBottom: "20px",
                padding: "10px 14px",
                background: "#f8faf8",
                border: "1px solid var(--line)",
                borderRadius: "6px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                Active Filters:
              </span>

              {appliedFilters.search && (
                <span
                  style={{
                    background: "#e9f0e9",
                    color: "var(--green)",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Search: &quot;{appliedFilters.search}&quot;
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setAppliedFilters((prev) => ({ ...prev, search: "" }));
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b" }}
                  >
                    ×
                  </button>
                </span>
              )}

              {appliedFilters.location !== "all" && (
                <span
                  style={{
                    background: "#e9f0e9",
                    color: "var(--green)",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Location: {appliedFilters.location}
                  <button
                    type="button"
                    onClick={() => handleLocationChange("all")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b" }}
                  >
                    ×
                  </button>
                </span>
              )}

              {appliedFilters.style !== "all" && (
                <span
                  style={{
                    background: "#e9f0e9",
                    color: "var(--green)",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Style: {appliedFilters.style}
                  <button
                    type="button"
                    onClick={() => handleStyleChange("all")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b" }}
                  >
                    ×
                  </button>
                </span>
              )}

              {appliedFilters.services.map((srv) => (
                <span
                  key={srv}
                  style={{
                    background: "var(--mint)",
                    color: "var(--green)",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Service: {srv}
                  <button
                    type="button"
                    onClick={() => toggleService(srv)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b", fontWeight: 700 }}
                  >
                    ×
                  </button>
                </span>
              ))}

              {appliedFilters.minimumRating && (
                <span
                  style={{
                    background: "#e9f0e9",
                    color: "var(--green)",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  ★ 4.5+
                  <button
                    type="button"
                    onClick={() => handleRatingChange(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b" }}
                  >
                    ×
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={resetFilters}
                style={{
                  background: "none",
                  border: "none",
                  color: "#991b1b",
                  fontSize: "11px",
                  cursor: "pointer",
                  marginLeft: "auto",
                  textDecoration: "underline",
                }}
              >
                Clear all
              </button>
            </div>
          )}

          {loading && <p>Loading designer profiles...</p>}

          {!loading && error && (
            <div className="empty-state">
              <h3>Unable to load designers</h3>
              <p>{error}</p>
              <button
                className="btn"
                type="button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && filteredPeople.length > 0 && (
            <div className="designer-grid listing-grid">
              {filteredPeople.map((person) => (
                <article className="designer-card" key={person.id}>
                  <div className="designer-photo">
                    {person.image ? (
                      <img
                        src={person.image}
                        alt={`${person.style} interior design`}
                      />
                    ) : (
                      <div className="designer-image-placeholder">
                        Interior Designer
                      </div>
                    )}

                    {person.isVerified && (
                      <span className="verified">✓ Verified</span>
                    )}
                  </div>

                  <div className="card-body">
                    <div className="card-title">
                      <h3>{person.name}</h3>
                      <span>★ {Number(person.rating).toFixed(1)}</span>
                    </div>

                    <p>{person.style}</p>

                    {/* Services Chips */}
                    {Array.isArray(person.services) && person.services.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                          margin: "6px 0 10px",
                        }}
                      >
                        {person.services.slice(0, 3).map((srv) => (
                          <span
                            key={srv}
                            style={{
                              fontSize: "10px",
                              background: "#edf4ef",
                              color: "var(--green)",
                              padding: "2px 6px",
                              borderRadius: "3px",
                              fontWeight: 500,
                            }}
                          >
                            {srv}
                          </span>
                        ))}
                      </div>
                    )}

                    <small>
                      ⌖ {person.city} · {person.experienceYears}+ years experience
                    </small>

                    <Link
                      className="outline-btn"
                      href={`/designer/${person.id}`}
                      style={{ marginTop: "10px" }}
                    >
                      View Profile
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && filteredPeople.length === 0 && (
            <div className="empty-state">
              <h3>No designers found matching your criteria</h3>
              <p>
                {people.length === 0
                  ? "No designer profiles have been added to the database yet."
                  : "Try clearing selected services or adjusting your location and style filters."}
              </p>
              {people.length > 0 && (
                <button
                  className="btn"
                  type="button"
                  onClick={resetFilters}
                  style={{ marginTop: "10px" }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
