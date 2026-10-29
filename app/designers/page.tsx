
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

const serviceOptions = [
  "Residential",
  "Commercial",
  "Kitchen",
  "Living room",
];

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
              : "Something went wrong while loading designers.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDesigners();

    return () => {
      active = false;
    };
  }, []);

  const locations = useMemo(
    () =>
      Array.from(
        new Set(people.map((person) => person.city).filter(Boolean)),
      ).sort(),
    [people],
  );

  const styles = useMemo(
    () =>
      Array.from(
        new Set(people.map((person) => person.style).filter(Boolean)),
      ).sort(),
    [people],
  );

  const filteredPeople = useMemo(() => {
    let result = people.filter((person) => {
      const searchText = appliedFilters.search.toLowerCase();

      const matchesSearch =
        person.name.toLowerCase().includes(searchText) ||
        person.style.toLowerCase().includes(searchText) ||
        person.city.toLowerCase().includes(searchText);

      const matchesLocation =
        appliedFilters.location === "all" ||
        person.city === appliedFilters.location;

      const matchesStyle =
        appliedFilters.style === "all" ||
        person.style
          .toLowerCase()
          .includes(appliedFilters.style.toLowerCase());

      const matchesServices =
        appliedFilters.services.length === 0 ||
        appliedFilters.services.every((service) =>
          (person.services ?? []).includes(service),
        );

      const matchesRating =
        !appliedFilters.minimumRating ||
        Number(person.rating) >= 4.5;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesStyle &&
        matchesServices &&
        matchesRating
      );
    });

    if (sortBy === "highest") {
      result = [...result].sort(
        (a, b) => Number(b.rating) - Number(a.rating),
      );
    } else if (sortBy === "experienced") {
      result = [...result].sort(
        (a, b) => b.experienceYears - a.experienceYears,
      );
    }

    return result;
  }, [people, appliedFilters, sortBy]);

  function toggleService(service: string) {
    setServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service],
    );
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

        <p>
          Discover experienced professionals who understand your vision.
        </p>

        <form
          className="mini-search"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
          <input
            type="search"
            placeholder="Search by designer name or style"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
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
        <aside className="filters">
          <h3>Filters</h3>

          <label>
            Location
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
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
              onChange={(event) => setStyle(event.target.value)}
            >
              <option value="all">All styles</option>
              {styles.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <h4>Services</h4>

          {serviceOptions.map((service) => (
            <label className="check-label" key={service}>
              <input
                type="checkbox"
                checked={services.includes(service)}
                onChange={() => toggleService(service)}
              />
              {service}
            </label>
          ))}

          <h4>Minimum rating</h4>

          <label className="check-label">
            <input
              type="checkbox"
              checked={minimumRating}
              onChange={(event) =>
                setMinimumRating(event.target.checked)
              }
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
          >
            Reset Filters
          </button>
        </aside>

        <section>
          <div className="results-head">
            <div>
              <h2>Designers for you</h2>
              <p>
                {loading
                  ? "Loading designers..."
                  : `${filteredPeople.length} designers found`}
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
                      <span>
                        ★ {Number(person.rating).toFixed(1)}
                      </span>
                    </div>

                    <p>{person.style}</p>

                    <small>
                      ⌖ {person.city} · {person.experienceYears}+
                      years experience
                    </small>

                    <Link
                      className="outline-btn"
                      href={`/designer/${person.id}`}
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
              <h3>No designers found</h3>
              <p>
                {people.length === 0
                  ? "No designer profiles have been added to the database yet."
                  : "Try changing your search or removing some filters."}
              </p>
              {people.length > 0 && (
                <button
                  className="btn"
                  type="button"
                  onClick={resetFilters}
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
 