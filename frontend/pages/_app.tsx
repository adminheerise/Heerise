import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccess, clearTokens } from "@/lib/auth";

export default function App({ Component, pageProps }: AppProps) {
  const [authed, setAuthed] = useState(false);
  useEffect(() => { setAuthed(!!getAccess()); }, []);
  return (
    <div className="container">
      <nav className="nav">
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/profile">Profile</Link>
        {!authed && <Link href="/login">Login</Link>}
        {!authed && <Link href="/register">Register</Link>}
        {authed && <a href="#" onClick={() => { clearTokens(); location.href="/"; }}>Logout</a>}
      </nav>
      <Component {...pageProps} />
    </div>
  );
}
