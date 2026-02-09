import { useState } from "react";
import { api } from "@/lib/api";

export default function Register() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [fullName, setFullName] = useState(""); 
  const [username, setUsername] = useState(""); 
  const [err, setErr] = useState<string | null>(null);

  const validate = () => {
    if (pw !== pw2) return "Passwords do not match";
    if (pw.length < 8) return "Password must be at least 8 characters";
    const hasLower = /[a-z]/.test(pw);
    const hasUpper = /[A-Z]/.test(pw);
    const hasDigit = /\d/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    if (!(hasLower && hasUpper && hasDigit && hasSpecial)) {
      return "Password must include uppercase, lowercase, number, and special character";
    }
    return null;
  };

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

      <label>Confirm Password</label>
      <input
        type="password"
        value={pw2}
        onChange={(e) => setPw2(e.target.value)}
      />
      <p className="muted" style={{ marginTop: 6, fontSize: 12 }}>
        Password must be 8+ chars and include uppercase, lowercase, number, and special character.
      </p>

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
            const v = validate();
            if (v) {
              setErr(v);
              return;
            }
            const data: any = await api.register(email, pw, pw2, fullName, username);
            const dev = data?.dev_verify_url ? `&dev=${encodeURIComponent(String(data.dev_verify_url))}` : "";
            location.href = `/verify-sent?email=${encodeURIComponent(email)}${dev}`;
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
