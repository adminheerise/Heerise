import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useRouter } from "next/router";

type Stats = {
  total_users: number;
  active_users: number;
  premium_conversion_rate: number;
  content_performance: Array<{ title: string; completion_rate: number; views: number }>;
};

type UserRow = {
  id: string;
  name: string;
  target_job_category: string;
  readiness_score: number | null;
  subscription_status: string;
  role: string;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // auth & role check via backend
        const [s, u] = await Promise.all([
          apiGet("/admin/stats", true),
          apiGet("/admin/users?limit=20", true),
        ]);
        setStats(s);
        setUsers(u);
      } catch (e: any) {
        const msg = e?.message || "Failed to load admin";
        setErr(msg);
        // If not logged in, go login
        if (msg.toLowerCase().includes("not authenticated") || msg.includes("401")) {
          router.push("/login");
        }
      }
    })();
  }, [router]);

  return (
    <div style={{ maxWidth: 1120, margin: "24px auto", padding: "0 12px" }}>
      <div className="card">
        <div className="cardHeader">
          <div>
            <h2 className="pageTitle">Overview Dashboard</h2>
            <div className="muted">Internal view (admin only).</div>
          </div>
          <div className="pill">Admin</div>
        </div>

        {err && (
          <p style={{ color: "crimson" }}>
            {err} {err.toLowerCase().includes("admin") || err.includes("403") ? "(Need admin role)" : ""}
          </p>
        )}

        {stats && (
          <div className="metricRow" style={{ marginTop: 8 }}>
            <div className="card">
              <div className="metricLabel">Total Users</div>
              <div className="metricValue">{stats.total_users}</div>
            </div>
            <div className="card">
              <div className="metricLabel">Active Users (WAU-lite)</div>
              <div className="metricValue">{stats.active_users}</div>
            </div>
            <div className="card">
              <div className="metricLabel">Premium Conversion</div>
              <div className="metricValue">{Math.round(stats.premium_conversion_rate * 1000) / 10}%</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid2" style={{ marginTop: 16, gridTemplateColumns: "1fr 420px" }}>
        <div className="card">
          <div className="cardTitle">User Management</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            Columns aligned with spec (MVP simplified).
          </div>

          <div style={{ overflowX: "auto", marginTop: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  {["User ID", "Name", "Target Job", "Progress/Score", "Sub Status", "Action"].map((h) => (
                    <th key={h} style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                      <span className="muted">{u.id.slice(0, 8)}…</span>
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,.06)" }}>{u.name}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,.06)" }}>{u.target_job_category}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                      {u.readiness_score ?? "—"}
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                      {u.subscription_status}
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                      <a href="#" onClick={(e) => e.preventDefault()}>
                        View
                      </a>{" "}
                      /{" "}
                      <a href="#" onClick={(e) => e.preventDefault()}>
                        Suspend
                      </a>
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan={6} className="muted" style={{ padding: 12 }}>
                      No users loaded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">Content Management</div>
          <div className="btnRow" style={{ marginTop: 10 }}>
            <button className="btnPrimary" style={{ marginTop: 0 }} onClick={() => alert("Coming soon")}>
              Post New Course
            </button>
            <button style={{ marginTop: 0 }} onClick={() => alert("Coming soon")}>
              Post New Article
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
              Content Title | Completion Rate | Views
            </div>
            {(stats?.content_performance || []).map((c) => (
              <div key={c.title} style={{ padding: "10px 0", borderTop: "1px solid rgba(0,0,0,.08)" }}>
                <div style={{ fontWeight: 700 }}>{c.title}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  Completion: {Math.round(c.completion_rate * 1000) / 10}% · Views: {c.views}
                </div>
              </div>
            ))}
            {!stats && <div className="muted">Loading…</div>}
          </div>
        </div>
      </div>
    </div>
  );
}


