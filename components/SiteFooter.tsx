import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footerbrand">⌂ InteriorFinder</div>
      <div>Transforming Spaces, Enriching Lives</div>
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <small>© 2026 InteriorFinder · Find the right designer for your dream space.</small>
        <Link
          href="/admin/login"
          style={{ fontSize: "11px", color: "#85877f", textDecoration: "none" }}
          title="System Administrator Login"
        >
          Admin Portal 🔒
        </Link>
      </div>
    </footer>
  );
}
