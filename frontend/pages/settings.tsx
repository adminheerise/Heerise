import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { clearTokens } from "@/lib/auth";
import { useRouter } from "next/router";

type Tab = "subscription" | "legal";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("subscription");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // simple auth gate
    (async () => {
      try {
        await apiGet("/me", true);
      } catch (e: any) {
        router.push("/login");
      }
    })();
  }, [router]);

  const downloadMyData = async () => {
    setBusy(true);
    setErr(null);
    try {
      const data = await apiGet("/me/export", true);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `heerise-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.message || "Failed to download data");
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Delete account? This cannot be undone.")) return;
    setBusy(true);
    setErr(null);
    try {
      await apiGet("/me", true); // ensure authed
      const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
      const token = localStorage.getItem("access");
      const res = await fetch(`${base}/me`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          if (j?.detail) msg = j.detail;
        } catch {}
        throw new Error(msg);
      }
      clearTokens();
      router.push("/");
    } catch (e: any) {
      setErr(e?.message || "Failed to delete account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 1120, margin: "24px auto", padding: "0 12px" }}>
      <div className="card">
        <div className="cardHeader">
          <div>
            <h2 className="pageTitle">Settings</h2>
            <div className="muted">Subscription & legal/privacy controls.</div>
          </div>
          <div className="pill">Settings</div>
        </div>

        {err && <p style={{ color: "crimson" }}>{err}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          <button
            className={tab === "subscription" ? "btnPrimary" : "btnGhost"}
            style={{ marginTop: 0 }}
            onClick={() => setTab("subscription")}
          >
            Subscription
          </button>
          <button
            className={tab === "legal" ? "btnPrimary" : "btnGhost"}
            style={{ marginTop: 0 }}
            onClick={() => setTab("legal")}
          >
            Legal & Privacy
          </button>
        </div>
      </div>

      {tab === "subscription" && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="cardTitle">Current Plan: Free Tier</div>
          <div style={{ marginTop: 10 }} className="muted">
            MVP placeholder — billing integration comes later.
          </div>

          <div className="card" style={{ marginTop: 12, background: "rgba(79,70,229,.04)" }}>
            <div className="cardTitle">Upgrade to Premium</div>
            <div style={{ marginTop: 6, fontWeight: 700 }}>$X / Month or $X / Year</div>
            <ul style={{ marginTop: 10 }}>
              <li>Unlimited AI Mock Interviews</li>
              <li>Advanced Resume Rewrite & Tailoring</li>
              <li>Priority Mentor Matching</li>
              <li>Access to Full Project Library</li>
            </ul>
            <button className="btnPrimary" disabled={busy}>
              Upgrade Now
            </button>
            <div style={{ marginTop: 10 }}>
              <a className="muted" href="#" onClick={(e) => e.preventDefault()}>
                View Invoices (coming soon)
              </a>
            </div>
          </div>
        </div>
      )}

      {tab === "legal" && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="cardTitle">Disclaimer</div>
          <div style={{ marginTop: 10, lineHeight: 1.6 }}>
            All career advice, content, and AI-generated information provided by HeeRise are
            for educational and informational purposes only.{" "}
            <strong>This does not constitute legal or professional advice.</strong>
          </div>

          <div style={{ marginTop: 16 }} className="btnRow">
            <button onClick={downloadMyData} disabled={busy}>
              Download My Data
            </button>
            <button className="btnGhost" onClick={() => alert("Link placeholder")}>
              Privacy Policy
            </button>
            <button className="btnGhost" onClick={() => alert("Link placeholder")}>
              Terms of Service
            </button>
          </div>

          <div style={{ marginTop: 16, borderTop: "1px solid rgba(0,0,0,.08)", paddingTop: 16 }}>
            <div className="cardTitle">Account Actions</div>
            <button
              onClick={deleteAccount}
              disabled={busy}
              style={{
                marginTop: 10,
                background: "rgba(220,38,38,.08)",
                borderColor: "rgba(220,38,38,.25)",
                color: "#b91c1c",
                fontWeight: 700,
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


