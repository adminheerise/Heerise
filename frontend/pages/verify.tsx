import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

export default function VerifyEmail() {
  const router = useRouter();
  const token = useMemo(() => {
    const t = router.query.token;
    return typeof t === "string" ? t : "";
  }, [router.query.token]);

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState<string>("Verifying...");

  useEffect(() => {
    if (!router.isReady) return;
    if (!token) {
      setStatus("error");
      setMsg("Missing token.");
      return;
    }
    (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
        const res = await fetch(`${base}/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
        setStatus("ok");
        setMsg("Verified! Redirecting to login...");
        setTimeout(() => router.replace(data?.next || "/login?next=/onboarding/1"), 800);
      } catch (e: any) {
        setStatus("error");
        setMsg(e?.message || "Verification failed");
      }
    })();
  }, [router.isReady, token, router]);

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", padding: "0 12px" }}>
      <div className="card">
        <div className="cardHeader">
          <div>
            <h2 className="pageTitle">Email Verification</h2>
            <div className="muted">{status === "loading" ? "Please wait..." : ""}</div>
          </div>
          <div className="pill">Verify</div>
        </div>

        <p style={{ color: status === "error" ? "crimson" : undefined }}>{msg}</p>
        {status !== "loading" && (
          <div className="btnRow" style={{ marginTop: 12 }}>
            <button className="btnPrimary" onClick={() => (location.href = "/login")}>
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


