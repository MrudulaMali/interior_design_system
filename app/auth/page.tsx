
"use client";

import Link from "next/link";
import { useState } from "react";

const roles = [
  {
    id: "user",
    title: "Customer",
    description: "Find designers for your dream space.",
    icon: "👤",
  },
  {
    id: "designer",
    title: "Interior Designer",
    description: "Showcase your portfolio and find customers.",
    icon: "🏡",
  },
];

export default function AuthPage() {
  const [role, setRole] = useState("user");
  const [mode, setMode] = useState("login");

  return (
    <main className="role-auth-page">
      <section className="role-auth-card">
        <Link href="/" className="auth-brand">
          InteriorFinder
        </Link>

        <p className="auth-eyebrow">YOUR SPACE, YOUR STYLE</p>

        <h1>
          {mode === "login"
            ? "Welcome Back!"
            : "Create Your Account"}
        </h1>

        <p className="auth-description">
          Choose how you want to use InteriorFinder.
        </p>

        <div className="role-options">
          {roles.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`role-option ${
                role === item.id ? "selected" : ""
              }`}
              onClick={() => setRole(item.id)}
            >
              <span className="role-icon">{item.icon}</span>
              <span className="role-title">{item.title}</span>
              <span className="role-description">
                {item.description}
              </span>
              <span className="role-radio">
                {role === item.id ? "●" : "○"}
              </span>
            </button>
          ))}
        </div>

        <div className="auth-mode-switch">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Login
          </button>

          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <Link
          className="role-continue-button"
          href={`/login?role=${role}&mode=${mode}`}
        >
          Continue as{" "}
          {roles.find((item) => item.id === role)?.title}
          {" →"}
        </Link>

        <p className="auth-back-home">
          <Link href="/">← Back to website</Link>
        </p>
      </section>
    </main>
  );
}
