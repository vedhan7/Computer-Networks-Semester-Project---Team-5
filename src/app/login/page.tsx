"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      localStorage.setItem("acorn_token", data.token);
      localStorage.setItem("acorn_user", JSON.stringify({ username: data.username, role: data.role }));
      document.cookie = `acorn_token=${data.token}; path=/`;
      router.push("/dashboard");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--acorn-bg)",
      backgroundImage: `
        radial-gradient(ellipse 80% 80% at 50% -20%, rgba(59,130,246,0.12), transparent),
        radial-gradient(ellipse 50% 50% at 80% 80%, rgba(34,211,238,0.06), transparent)
      `,
    }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 64, height: 64, borderRadius: 16, marginBottom: 16,
            background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(34,211,238,0.1))",
            border: "1px solid rgba(59,130,246,0.3)",
            fontSize: 28,
          }}>🌐</div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #e0f2fe, var(--cyan))",
            WebkitBackgroundClip: "text", backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>ACORN</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Academic Context-Orchestrated Resilient Network
          </p>
        </div>

        {/* Form */}
        <div className="card" style={{ borderColor: "rgba(59,130,246,0.15)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>
            Administrator Login
          </h2>

          {error && (
            <div className="alert alert-critical" style={{ marginBottom: 16 }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="label" htmlFor="username">Username</label>
              <input id="username" className="input" type="text" placeholder="admin"
                value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" className="input" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full" style={{ marginTop: 4 }} disabled={loading}>
              {loading ? <><div className="spinner" />Authenticating…</> : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text-secondary)" }}>Default credentials:</strong><br />
            Admin: <span style={{ fontFamily: "var(--font-mono)", color: "var(--cyan)" }}>admin / acorn2026</span><br />
            Viewer: <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>viewer / viewer123</span>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "var(--text-muted)" }}>
          © 2026 ACORN Framework — Academic Networks Research Lab
        </div>
      </div>
    </div>
  );
}
