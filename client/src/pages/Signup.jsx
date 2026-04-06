
import { useState } from "react";
import { signupUser } from "../api";
import { Link } from "react-router-dom";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await signupUser(form);

    if (res.error) {
      setMessage(res.error);
      return;
    }

    setMessage("Signup successful! You can login now.");
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
            Create your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            style={inputStyle}
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            style={{ ...inputStyle, marginTop: "0.8rem" }}
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            style={{ ...inputStyle, marginTop: "0.8rem" }}
          />

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
            Sign Up
          </button>
        </form>

        {/* Message */}
        {message && (
          <div
            style={{
              marginTop: "1rem",
              fontSize: "0.8rem",
              textAlign: "center",
              color: message.includes("successful")
                ? "#4ade80"
                : "#f87171",
            }}
          >
            {message}
          </div>
        )}

        {/* Login Link */}
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
            Already have an account?{" "}
          </span>
          <Link
            to="/login"
            style={{
              color: "#f97316",
              fontSize: "0.8rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

// 🔹 Shared input style
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

