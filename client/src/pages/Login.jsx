
import { useState } from "react";
import { loginUser } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await loginUser(form);

    if (res.error) {
      setError(res.error);
      return;
    }

    login(res);
    window.location.reload();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "2rem",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1.8rem",
              background: "linear-gradient(135deg, #f97316, #ef4444)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            RedditPulse
          </h1>

          <p style={{ color: "#475569", fontSize: "0.85rem" }}>
            Login to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            style={inputStyle}
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            style={{ ...inputStyle, marginTop: "0.8rem" }}
          />

          {/* Button */}
          <button
            type="submit"
            style={{
              marginTop: "1.2rem",
              width: "100%",
              padding: "0.7rem",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              background:
                "linear-gradient(135deg, #f97316, #ef4444)",
              color: "#fff",
            }}
          >
            Login
          </button>
        </form>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: "1rem",
              color: "#f87171",
              fontSize: "0.8rem",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// 🔹 Reusable input style
const inputStyle = {
  width: "100%",
  padding: "0.65rem 0.8rem",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#0f1a2e",
  color: "#e2e8f0",
  fontSize: "0.85rem",
  outline: "none",
};

