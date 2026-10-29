"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--muted)" }}>
      Redirecting to Admin Dashboard...
    </div>
  );
}