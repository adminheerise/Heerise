import { useState } from "react";
import { api } from "@/lib/api";
import { saveTokens } from "@/lib/auth";

export default function Login(){
  const [email,setEmail]=useState(""); const [pw,setPw]=useState("");
  const [err,setErr]=useState<string|null>(null);
  return (<div>
    <h2>Login</h2>
    {err && <p style={{color:"crimson"}}>{err}</p>}
    <label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} />
    <label>Password</label><input type="password" value={pw} onChange={e=>setPw(e.target.value)} />
    <button onClick={async()=>{
      try{
        const t = await api.login(email,pw);
        saveTokens(t.access_token, t.refresh_token);
        location.href="/dashboard";
      }catch(e:any){ setErr(e.message); }
    }}>Sign In</button>
  </div>);
}
