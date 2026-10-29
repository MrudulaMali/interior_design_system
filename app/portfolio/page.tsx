import { Suspense } from "react";
import { getApprovedPortfolioProjects, type PublicProjectItem } from "@/lib/designers";
import PortfolioClient from "./PortfolioClient";

const defaultInspirations: PublicProjectItem[] = [
  {
    id: 1,
    title: "Warm Minimal Living & Dining",
    category: "Living room",
    designerCity: "Pune",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
    designerProfileId: 1,
    designerName: "Riya Sharma Designs",
    description: "Serene neutral-toned living space tailored for calm everyday living.",
  },
  {
    id: 2,
    title: "Modern Open Plan Kitchen",
    category: "Kitchen",
    designerCity: "Mumbai",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    designerProfileId: 1,
    designerName: "Riya Sharma Designs",
    description: "Quartz countertops with fluted oak cabinetry and integrated appliances.",
  },
  {
    id: 3,
    title: "Soft Neutral Master Bedroom",
    category: "Bedroom",
    designerCity: "Pune",
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=80",
    designerProfileId: 2,
    designerName: "Contemporary Living",
    description: "Textured headboard wall with warm ambient illumination.",
  },
  {
    id: 4,
    title: "Boutique Executive Office Studio",
    category: "Commercial",
    designerCity: "Kolhapur",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
    designerProfileId: 3,
    designerName: "Studio Luxe",
    description: "Modern executive suite with acoustic panels and bespoke storage.",
  },
  {
    id: 5,
    title: "Modern Japandi Dining Area",
    category: "Dining",
    designerCity: "Pune",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
    designerProfileId: 1,
    designerName: "Riya Sharma Designs",
    description: "Solid oak dining table and linen hanging lamps.",
  },
  {
    id: 6,
    title: "Urban Minimalist Penthouse",
    category: "Residential",
    designerCity: "Mumbai",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80",
    designerProfileId: 2,
    designerName: "Contemporary Living",
    description: "High ceilings with floor-to-ceiling panoramic glass windows.",
  },
];

export default function PortfolioPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
          Loading design portfolio...
        </div>
      }
    >
      <PortfolioLoader />
    </Suspense>
  );
}

async function PortfolioLoader() {
  const realProjects = await getApprovedPortfolioProjects();
  const displayProjects = realProjects.length > 0 ? realProjects : defaultInspirations;

  return <PortfolioClient initialProjects={displayProjects} />;
}
