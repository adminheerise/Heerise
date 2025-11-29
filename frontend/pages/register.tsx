import { useState } from "react";
import { api } from "@/lib/api";
import { saveTokens } from "@/lib/auth";

export default function Register() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [fullName, setFullName] = useState(""); 
  const [username, setUsername] = useState(""); 
  const [err, setErr] = useState<string | null>(null);

  return (
    <div>
      <h2>Register</h2>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <label>Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />

      <label>Password</label>
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />

      {/* Full Name */}
      <label>Full Name</label>
      <input
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Your full name"
      />

      {/* User Name */}
      <label>User Name</label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Your display / user name"
      />

      <button
        onClick={async () => {
          try {
            const t = await api.register(email, pw, fullName, username);
            saveTokens(t.access_token, t.refresh_token);
            location.href = "/onboarding/1";
          } catch (err: any) {
            const msg = err?.message || "Registration failed";
            setErr(msg);
          }
        }}
      >
        Create Account
      </button>
    </div>
  );
}
