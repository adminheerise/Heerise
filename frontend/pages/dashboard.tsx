import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function Dashboard() {
  const [me, setMe] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.me();
        setMe(data);
      } catch (e: any) {
        setErr(e.message);
      }
    })();
  }, []);

  if (err) return <p style={{ color: "crimson" }}>{err}</p>;
  if (!me) return <p>Loading...</p>;

  const displayName = me.name || me.username || me.email;

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", padding: "0 12px" }}>
      <h2>Welcome, {displayName}</h2>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h3>Snapshot</h3>
        <p>
          <b>Location:</b>{" "}
          {me.current_city || me.state || me.country || "Not set"}
        </p>
        <p>
          <b>Major of Study:</b> {me.major_of_study || "Not set"}
        </p>
        <p>
          <b>Current Career Stage:</b> {me.current_career_stage || "Not set"}
        </p>
        <p>
          <b>Commitment Level:</b> {me.commitment_level || "Not set"}
        </p>
      </div>

      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
          background: "#fafafa",
        }}
      >
        <h3>Next Steps</h3>
        <ul>
          <li>
            Review your <a href="/profile">profile</a> to make sure your
            background and goals are up to date.
          </li>
          <li>
            We will soon recommend learning paths based on your skills,
            interests, and career stage (coming soon).
          </li>
        </ul>
      </div>
    </div>
  );
}
