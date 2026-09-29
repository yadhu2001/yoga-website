"use client";

import { useState } from "react";

export function LoginForm({ ready }: { ready: boolean }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      location.href = "/admin";
    } catch (error) {
      setError((error as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="section" style={{ minHeight: "100vh", background: "#f4f8fd" }}>
      <div className="wrap" style={{ maxWidth: 480 }}>
        <div className="eyebrow">Sree Pranavam</div>
        <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.4rem)" }}>Admin sign in</h1>
        <p className="mt-4 mb-8">Sign in to manage pages, courses, uploads and enquiries.</p>
        <form className="admin-panel" onSubmit={submit}>
          {!ready && (
            <p className="notice error mb-5">
              Add ADMIN_USERNAME and ADMIN_PASSWORD to the .env file, then restart the server.
            </p>
          )}
          {error && <p className="notice error mb-5">{error}</p>}
          <label className="field">
            Username
            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              disabled={!ready || busy}
            />
          </label>
          <label className="field">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={!ready || busy}
            />
          </label>
          <button className="btn" type="submit" disabled={!ready || busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <a href="/" className="card-link mt-6">
          Back to website
        </a>
      </div>
    </main>
  );
}
