import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";

export default function VerifySent() {
  const router = useRouter();
  const email = useMemo(() => {
    const q = router.query.email;
    return typeof q === "string" ? q : "";
  }, [router.query.email]);
  const [msg, setMsg] = useState<string>("We sent you a verification link. Please check your email.");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const devUrl = useMemo(() => {
    const q = router.query.dev;
    return typeof q === "string" && q ? q : null;
  }, [router.query.dev]);

  const resend = async () => {
    if (!email) {
      setErr("Missing email");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const data: any = await api.resendVerification(email);
      if (data?.dev_verify_url) {
        // In dev mode, backend may return a local verification URL
        location.href = `/verify-sent?email=${encodeURIComponent(email)}&dev=${encodeURIComponent(
          String(data.dev_verify_url)
        )}`;
      } else {
        setMsg("Verification email resent. Please check your inbox (and spam folder).");
      }
    } catch (e: any) {
      setErr(e?.message || "Failed to resend");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", padding: "0 12px" }}>
      <div className="card">
        <div className="cardHeader">
          <div>
            <h2 className="pageTitle">Verify your email</h2>
            <div className="muted">{email ? `Email: ${email}` : ""}</div>
          </div>
          <div className="pill">Email</div>
        </div>

        {err && <p style={{ color: "crimson" }}>{err}</p>}
        <p style={{ marginTop: 6 }}>{msg}</p>

        {devUrl && (
          <div className="card" style={{ marginTop: 12, background: "rgba(79,70,229,.04)" }}>
            <div className="cardTitle">Local verification (dev)</div>
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              SMTP is not configured, so the backend provided a local verification URL:
            </div>
            <div style={{ marginTop: 8, wordBreak: "break-all" }}>
              <a href={devUrl}>{devUrl}</a>
            </div>
            <div className="btnRow" style={{ marginTop: 10 }}>
              <button className="btnPrimary" onClick={() => (location.href = devUrl)} disabled={busy}>
                Verify now
              </button>
            </div>
          </div>
        )}

        <div className="btnRow" style={{ marginTop: 12 }}>
          <button onClick={resend} disabled={busy}>
            {busy ? "Sending..." : "Resend email"}
          </button>
          <button className="btnPrimary" onClick={() => (location.href = "/login")} disabled={busy}>
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}


