import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { saveTokens } from "@/lib/auth";
import { useRouter } from "next/router";

export default function Login(){
  const router = useRouter();
  const [email,setEmail]=useState(""); const [pw,setPw]=useState("");
  const [err,setErr]=useState<string|null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.email;
    if (typeof q === "string" && q) setEmail(q);
  }, [router.isReady, router.query.email]);

  return (<div>
    <h2>Login</h2>
    {err && <p style={{color:"crimson"}}>{err}</p>}
    <label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} />
    <label>Password</label><input type="password" value={pw} onChange={e=>setPw(e.target.value)} />
    <button onClick={async()=>{
      try{
        const t = await api.login(email,pw);
        saveTokens(t.access_token, t.refresh_token);
        const next = typeof router.query.next === "string" ? router.query.next : "";
        if (next) {
          location.href = next;
          return;
        }
        // fallback
        location.href="/dashboard";
      }catch(e:any){ setErr(e.message); }
    }}>Sign In</button>
    <div style={{ marginTop: 12 }} className="muted">
      Haven't verified your email yet?{" "}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          if (email) location.href = `/verify-sent?email=${encodeURIComponent(email)}`;
          else alert("Please enter your email first.");
        }}
      >
        Resend verification email
      </a>
    </div>
  </div>);
}
