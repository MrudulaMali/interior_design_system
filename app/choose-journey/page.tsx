"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RetiredJourneyPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirectByRole() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/login");
          return;
        }

        const data = await res.json();
        const role = data?.user?.role;

        if (role === "admin") {
          router.replace("/admin/dashboard");
        } else if (role === "designer") {
          router.replace("/designer/dashboard");
        } else {
          router.replace("/customer/dashboard");
        }
      } catch {
        router.replace("/login");
      }
    }

    void redirectByRole();
  }, [router]);

  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--muted)" }}>
      Redirecting to your authorized dashboard...
    </div>
  );
}