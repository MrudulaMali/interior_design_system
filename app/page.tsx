
import Link from "next/link";

import { db } from "@/db";
import { designers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Suspense } from "react";

const designerImages = [
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
];

const rooms = ["Living Room", "Bedroom", "Kitchen", "Office"];

export default function Home() {
  return (
    <Suspense fallback={<p>Loading designers...</p>}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const featuredDesigners = await db
    .select()
    .from(designers)
    .orderBy(desc(designers.createdAt))
    .limit(4);

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
      <div className="designer-photo">
        {designer.profileImage ? (
          <img
            src={designer.profileImage}
            alt={`${designer.fullName} interior design`}
          />
        ) : (
          <div className="designer-image-placeholder">
            Interior Designer
          </div>
        )}

        {designer.isVerified && (
          <span className="verified">✓ Verified</span>
        )}
      </div>

      <div className="card-body">
        <div className="card-title">
          <h3>{designer.fullName}</h3>
          <span>★ {designer.rating}</span>
        </div>

        <p>{designer.designStyle}</p>

        <small>
          ⌖ {designer.city} · {designer.experienceYears}+
          years experience
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
  <p>No designers have been added yet.</p>
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
              href="/designers"
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
            Tell us about your project and connect with the right
            professional.
          </p>
        </div>

        <Link className="btn btn-light" href="/enquiry">
          Send an Enquiry ↗
        </Link>
      </section>
    </>
  );
}
