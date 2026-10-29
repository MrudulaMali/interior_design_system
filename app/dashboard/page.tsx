"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardSmartRouter() {
  const router = useRouter();

  useEffect(() => {
    async function routeUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/login?redirect=/dashboard");
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
        router.replace("/login?redirect=/dashboard");
      }
    }

    void routeUser();
  }, [router]);

  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--muted)" }}>
      Directing you to your workspace...
    </div>
  );
}