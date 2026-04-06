import { useState } from "react";
import { signupUser } from "../api";

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
    <div style={{ padding: "2rem" }}>
      <h2>Signup</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />

        <button type="submit">Signup</button>
      </form>

      {message && <div>{message}</div>}
    </div>
  );
}